const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("AgentFactory - Comprehensive Tests", function () {
  // Test fixture for deployment
  async function deployFactoryFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();
    
    const deploymentFee = ethers.parseEther("0.001");
    
    // Deploy AgentFactory (includes implementation and token factories)
    const AgentFactory = await ethers.getContractFactory("AgentFactory");
    const factory = await AgentFactory.deploy(deploymentFee);
    await factory.waitForDeployment();
    
    const factoryAddress = await factory.getAddress();
    
    // Get implementation addresses
    const addresses = await factory.getImplementationAddresses();
    
    return {
      factory,
      factoryAddress,
      deploymentFee,
      owner,
      user1,
      user2,
      user3,
      implementation: addresses.implementation,
      erc20Factory: addresses.tokenFactory,
      erc721Factory: addresses.nftFactory
    };
  }

  describe("Deployment", function () {
    it("Should deploy factory successfully", async function () {
      const { factory, deploymentFee, owner } = await loadFixture(deployFactoryFixture);
      
      expect(await factory.deploymentFee()).to.equal(deploymentFee);
      expect(await factory.owner()).to.equal(owner.address);
      expect(await factory.totalAgentsDeployed()).to.equal(0);
    });

    it("Should deploy implementation and token factories", async function () {
      const { implementation, erc20Factory, erc721Factory } = await loadFixture(deployFactoryFixture);
      
      expect(implementation).to.not.equal(ethers.ZeroAddress);
      expect(erc20Factory).to.not.equal(ethers.ZeroAddress);
      expect(erc721Factory).to.not.equal(ethers.ZeroAddress);
      
      console.log("Implementation deployed at:", implementation);
      console.log("ERC20 Factory deployed at:", erc20Factory);
      console.log("ERC721 Factory deployed at:", erc721Factory);
    });
  });

  describe("Agent Deployment", function () {
    it("Should deploy agent successfully", async function () {
      const { factory, deploymentFee, user1 } = await loadFixture(deployFactoryFixture);
      
      const agentName = "TestAgent";
      const agentDescription = "A test AI agent";
      
      const tx = await factory.connect(user1).deployAgent(
        agentName,
        agentDescription,
        { value: deploymentFee }
      );
      
      const receipt = await tx.wait();
      
      // Check AgentDeployed event
      const event = receipt.logs.find(log => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed.name === "AgentDeployed";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      const parsedEvent = factory.interface.parseLog(event);
      const agentAddress = parsedEvent.args[0];
      
      expect(await factory.totalAgentsDeployed()).to.equal(1);
      expect(await factory.isAgent(agentAddress)).to.be.true;
      expect(await factory.getAgentByName(agentName)).to.equal(agentAddress);
      
      console.log("Agent deployed as minimal proxy at:", agentAddress);
    });

    it("Should deploy agent with initial funding", async function () {
      const { factory, deploymentFee, user1 } = await loadFixture(deployFactoryFixture);
      
      const initialFunding = ethers.parseEther("0.1");
      const totalPayment = deploymentFee + initialFunding;
      
      const tx = await factory.connect(user1).deployAgentWithFunding(
        "FundedAgent",
        "Agent with initial funding",
        initialFunding,
        { value: totalPayment }
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed.name === "AgentDeployed";
        } catch {
          return false;
        }
      });
      
      const agentAddress = factory.interface.parseLog(event).args[0];
      const agentBalance = await ethers.provider.getBalance(agentAddress);
      
      expect(agentBalance).to.equal(initialFunding);
      console.log("Agent funded with:", ethers.formatEther(agentBalance), "ETH");
    });

    it("Should fail with insufficient fee", async function () {
      const { factory, deploymentFee, user1 } = await loadFixture(deployFactoryFixture);
      
      await expect(
        factory.connect(user1).deployAgent(
          "TestAgent",
          "Description",
          { value: deploymentFee / 2n }
        )
      ).to.be.revertedWithCustomError(factory, "InvalidFee");
    });

    it("Should fail with duplicate name", async function () {
      const { factory, deploymentFee, user1, user2 } = await loadFixture(deployFactoryFixture);
      
      const agentName = "DuplicateAgent";
      
      // Deploy first agent
      await factory.connect(user1).deployAgent(
        agentName,
        "First agent",
        { value: deploymentFee }
      );
      
      // Try to deploy with same name
      await expect(
        factory.connect(user2).deployAgent(
          agentName,
          "Second agent",
          { value: deploymentFee }
        )
      ).to.be.revertedWithCustomError(factory, "NameTaken");
    });

    it("Should refund excess payment", async function () {
      const { factory, deploymentFee, user1 } = await loadFixture(deployFactoryFixture);
      
      const excessPayment = deploymentFee * 2n;
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      const tx = await factory.connect(user1).deployAgent(
        "RefundTest",
        "Testing refund",
        { value: excessPayment }
      );
      
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const finalBalance = await ethers.provider.getBalance(user1.address);
      
      // Should only pay deployment fee + gas
      expect(finalBalance).to.be.closeTo(
        initialBalance - deploymentFee - gasUsed,
        ethers.parseEther("0.0001") // Tolerance for gas estimation
      );
    });
  });

  describe("Agent Management", function () {
    it("Should track agents by owner", async function () {
      const { factory, deploymentFee, user1 } = await loadFixture(deployFactoryFixture);
      
      // Deploy multiple agents
      await factory.connect(user1).deployAgent(
        "Agent1",
        "First agent",
        { value: deploymentFee }
      );
      
      await factory.connect(user1).deployAgent(
        "Agent2", 
        "Second agent",
        { value: deploymentFee }
      );
      
      const userAgents = await factory.getAgentsByOwner(user1.address);
      expect(userAgents.length).to.equal(2);
      
      console.log("User1 agents:", userAgents);
    });

    it("Should allow owner to change agent status", async function () {
      const { factory, deploymentFee, user1 } = await loadFixture(deployFactoryFixture);
      
      const tx = await factory.connect(user1).deployAgent(
        "StatusTest",
        "Testing status change",
        { value: deploymentFee }
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed.name === "AgentDeployed";
        } catch {
          return false;
        }
      });
      
      const agentAddress = factory.interface.parseLog(event).args[0];
      
      // Change status to inactive
      await expect(
        factory.connect(user1).setAgentStatus(agentAddress, false)
      ).to.emit(factory, "AgentStatusChanged")
        .withArgs(agentAddress, false);
      
      const agentInfo = await factory.agentInfo(agentAddress);
      expect(agentInfo.isActive).to.be.false;
    });

    it("Should fail status change from non-owner", async function () {
      const { factory, deploymentFee, user1, user2 } = await loadFixture(deployFactoryFixture);
      
      const tx = await factory.connect(user1).deployAgent(
        "UnauthorizedTest",
        "Testing unauthorized access",
        { value: deploymentFee }
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed.name === "AgentDeployed";
        } catch {
          return false;
        }
      });
      
      const agentAddress = factory.interface.parseLog(event).args[0];
      
      await expect(
        factory.connect(user2).setAgentStatus(agentAddress, false)
      ).to.be.revertedWithCustomError(factory, "Unauthorized");
    });
  });

  describe("Factory Administration", function () {
    it("Should allow owner to update deployment fee", async function () {
      const { factory, owner } = await loadFixture(deployFactoryFixture);
      
      const newFee = ethers.parseEther("0.002");
      
      await expect(
        factory.connect(owner).setDeploymentFee(newFee)
      ).to.emit(factory, "FeeUpdated")
        .withArgs(newFee);
      
      expect(await factory.deploymentFee()).to.equal(newFee);
    });

    it("Should allow owner to withdraw fees", async function () {
      const { factory, deploymentFee, owner, user1 } = await loadFixture(deployFactoryFixture);
      
      // Deploy some agents to collect fees
      await factory.connect(user1).deployAgent(
        "FeeTest1",
        "Fee collection test 1",
        { value: deploymentFee }
      );
      
      await factory.connect(user1).deployAgent(
        "FeeTest2",
        "Fee collection test 2", 
        { value: deploymentFee }
      );
      
      const factoryBalance = await ethers.provider.getBalance(await factory.getAddress());
      expect(factoryBalance).to.equal(deploymentFee * 2n);
      
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      
      const tx = await factory.connect(owner).withdrawFees();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
      
      expect(finalOwnerBalance).to.be.closeTo(
        initialOwnerBalance + factoryBalance - gasUsed,
        ethers.parseEther("0.0001")
      );
    });

    it("Should allow owner to pause/unpause deployments", async function () {
      const { factory, deploymentFee, owner, user1 } = await loadFixture(deployFactoryFixture);
      
      // Pause deployments
      await factory.connect(owner).pauseDeployments();
      
      // Should fail to deploy when paused
      await expect(
        factory.connect(user1).deployAgent(
          "PausedTest",
          "Should fail when paused",
          { value: deploymentFee }
        )
      ).to.be.revertedWithCustomError(factory, "EnforcedPause");
      
      // Unpause deployments
      await factory.connect(owner).unpauseDeployments();
      
      // Should work after unpause
      await expect(
        factory.connect(user1).deployAgent(
          "UnpausedTest", 
          "Should work after unpause",
          { value: deploymentFee }
        )
      ).to.not.be.reverted;
    });

    it("Should not allow non-owner to change fee", async function () {
      const { factory, user1 } = await loadFixture(deployFactoryFixture);
      
      await expect(
        factory.connect(user1).setDeploymentFee(ethers.parseEther("0.002"))
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    it("Should return correct name availability", async function () {
      const { factory, deploymentFee, user1 } = await loadFixture(deployFactoryFixture);
      
      expect(await factory.isNameAvailable("AvailableName")).to.be.true;
      
      await factory.connect(user1).deployAgent(
        "TakenName",
        "This name will be taken", 
        { value: deploymentFee }
      );
      
      expect(await factory.isNameAvailable("TakenName")).to.be.false;
      expect(await factory.isNameAvailable("StillAvailable")).to.be.true;
    });

    it("Should return agent by name", async function () {
      const { factory, deploymentFee, user1 } = await loadFixture(deployFactoryFixture);
      
      const agentName = "NamedAgent";
      const tx = await factory.connect(user1).deployAgent(
        agentName,
        "Agent with searchable name",
        { value: deploymentFee }
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed.name === "AgentDeployed";
        } catch {
          return false;
        }
      });
      
      const expectedAddress = factory.interface.parseLog(event).args[0];
      const actualAddress = await factory.getAgentByName(agentName);
      
      expect(actualAddress).to.equal(expectedAddress);
    });
  });

  describe("Gas Optimization Verification", function () {
    it("Should show significant gas savings with proxy pattern", async function () {
      const { factory, deploymentFee, user1 } = await loadFixture(deployFactoryFixture);
      
      // Deploy first agent and measure gas
      const tx1 = await factory.connect(user1).deployAgent(
        "GasTest1",
        "First agent for gas testing",
        { value: deploymentFee }
      );
      const receipt1 = await tx1.wait();
      const gasUsed1 = receipt1.gasUsed;
      
      // Deploy second agent and measure gas  
      const tx2 = await factory.connect(user1).deployAgent(
        "GasTest2",
        "Second agent for gas testing",
        { value: deploymentFee }
      );
      const receipt2 = await tx2.wait();
      const gasUsed2 = receipt2.gasUsed;
      
      console.log("First agent deployment gas:", gasUsed1.toString());
      console.log("Second agent deployment gas:", gasUsed2.toString());
      
      // Both should use similar low amounts (proxy pattern) 
      expect(gasUsed1).to.be.lessThan(600000); // Should be much less than 2.5M
      expect(gasUsed2).to.be.lessThan(600000);
      
      // Gas usage should be consistent (proxies)
      const gasDiff = gasUsed1 > gasUsed2 ? gasUsed1 - gasUsed2 : gasUsed2 - gasUsed1;
      expect(gasDiff).to.be.lessThan(50000); // Should be very similar
    });
  });

  describe("Integration with Agent Functionality", function () {
    it("Should create functional agent proxy", async function () {
      const { factory, deploymentFee, user1 } = await loadFixture(deployFactoryFixture);
      
      // Deploy agent
      const tx = await factory.connect(user1).deployAgent(
        "FunctionalTest",
        "Testing agent functionality",
        { value: deploymentFee }
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed.name === "AgentDeployed";
        } catch {
          return false;
        }
      });
      
      const agentAddress = factory.interface.parseLog(event).args[0];
      
      // Get agent contract interface
      const AgentImplementation = await ethers.getContractFactory("AgentImplementation");
      const agent = AgentImplementation.attach(agentAddress);
      
      // Test basic functionality
      const agentInfo = await agent.getAgentInfo();
      expect(agentInfo.name).to.equal("FunctionalTest");
      expect(agentInfo.description).to.equal("Testing agent functionality");
      expect(agentInfo.admin).to.equal(user1.address);
      
      console.log("Agent proxy is functional:");
      console.log("- Name:", agentInfo.name);
      console.log("- Admin:", agentInfo.admin);
      console.log("- Balance:", ethers.formatEther(agentInfo.balance), "ETH");
    });
  });
});