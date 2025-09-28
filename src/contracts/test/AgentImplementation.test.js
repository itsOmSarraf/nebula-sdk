const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("AgentImplementation - Core Functionality Tests", function () {
  // Test fixture for agent deployment
  async function deployAgentFixture() {
    const [owner, admin, user1, user2, user3] = await ethers.getSigners();
    
    // Deploy factory first
    const deploymentFee = ethers.parseEther("0.001");
    const AgentFactory = await ethers.getContractFactory("AgentFactory");
    const factory = await AgentFactory.deploy(deploymentFee);
    await factory.waitForDeployment();
    
    // Deploy an agent via factory
    const agentName = "TestAgent";
    const agentDescription = "AI agent for comprehensive testing";
    const initialFunding = ethers.parseEther("1.0"); // 1 ETH initial funding
    
    const tx = await factory.connect(admin).deployAgentWithFunding(
      agentName,
      agentDescription,
      initialFunding,
      { value: deploymentFee + initialFunding }
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
    
    return {
      factory,
      agent,
      agentAddress,
      agentName,
      agentDescription,
      initialFunding,
      owner,
      admin,
      user1,
      user2,
      user3
    };
  }

  describe("Initialization and Basic Info", function () {
    it("Should initialize agent correctly", async function () {
      const { agent, agentName, agentDescription, admin, initialFunding } = await loadFixture(deployAgentFixture);
      
      const agentInfo = await agent.getAgentInfo();
      
      expect(agentInfo.name).to.equal(agentName);
      expect(agentInfo.description).to.equal(agentDescription);
      expect(agentInfo.admin).to.equal(admin.address);
      expect(agentInfo.balance).to.equal(initialFunding);
      
      // Check spending limit (33% of balance)
      const expectedLimit = (initialFunding * 33n) / 100n;
      expect(agentInfo.remainingSpendingLimit).to.equal(expectedLimit);
      
      console.log("✅ Agent initialized successfully:");
      console.log("   Name:", agentInfo.name);
      console.log("   Admin:", agentInfo.admin);
      console.log("   Balance:", ethers.formatEther(agentInfo.balance), "ETH");
      console.log("   Spending Limit:", ethers.formatEther(agentInfo.remainingSpendingLimit), "ETH");
    });

    it("Should have correct roles assigned", async function () {
      const { agent, admin } = await loadFixture(deployAgentFixture);
      
      const DEFAULT_ADMIN_ROLE = await agent.DEFAULT_ADMIN_ROLE();
      const AGENT_ROLE = await agent.AGENT_ROLE();
      
      expect(await agent.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await agent.hasRole(AGENT_ROLE, await agent.getAddress())).to.be.true;
      expect(await agent.owner()).to.equal(admin.address);
      
      console.log("✅ Roles assigned correctly");
    });
  });

  describe("Funding - Anyone Can Fund Agent", function () {
    it("Should allow anyone to fund agent directly", async function () {
      const { agent, user1 } = await loadFixture(deployAgentFixture);
      
      const fundAmount = ethers.parseEther("0.5");
      const initialBalance = await agent.getBalance();
      
      // Send ETH directly to agent
      await expect(
        user1.sendTransaction({
          to: await agent.getAddress(),
          value: fundAmount
        })
      ).to.emit(agent, "FundsReceived")
        .withArgs(user1.address, fundAmount, "Direct deposit");
      
      const finalBalance = await agent.getBalance();
      expect(finalBalance).to.equal(initialBalance + fundAmount);
      
      console.log("✅ User1 funded agent with", ethers.formatEther(fundAmount), "ETH");
    });

    it("Should allow anyone to fund with message", async function () {
      const { agent, user2 } = await loadFixture(deployAgentFixture);
      
      const fundAmount = ethers.parseEther("0.2");
      const message = "Donation for AI research";
      
      await expect(
        agent.connect(user2).deposit(message, { value: fundAmount })
      ).to.emit(agent, "FundsReceived")
        .withArgs(user2.address, fundAmount, message);
      
      console.log("✅ User2 funded with message:", message);
    });

    it("Should track total deposits per address", async function () {
      const { agent, user1, user2 } = await loadFixture(deployAgentFixture);
      
      const amount1 = ethers.parseEther("0.3");
      const amount2 = ethers.parseEther("0.7");
      
      await agent.connect(user1).deposit("First deposit", { value: amount1 });
      await agent.connect(user1).deposit("Second deposit", { value: amount2 });
      
      const totalDeposits = await agent.getTotalDeposits(user1.address);
      expect(totalDeposits).to.equal(amount1 + amount2);
      
      console.log("✅ Total deposits from user1:", ethers.formatEther(totalDeposits), "ETH");
    });
  });

  describe("Agent Spending - 33% Limit per 24 Hours", function () {
    it("Should allow agent to spend up to 33% of balance", async function () {
      const { agent, user1, admin } = await loadFixture(deployAgentFixture);
      
      const agentBalance = await agent.getBalance();
      const maxSpendingLimit = (agentBalance * 33n) / 100n;
      const spendAmount = maxSpendingLimit - ethers.parseEther("0.01"); // Slightly under limit
      
      // Grant agent role to admin for testing
      await agent.connect(admin).grantAgentRole(admin.address);
      
      await expect(
        agent.connect(admin).agentSpend(user1.address, spendAmount, "Test payment")
      ).to.emit(agent, "AgentSpending")
        .withArgs(user1.address, spendAmount, "Test payment");
      
      console.log("✅ Agent spent", ethers.formatEther(spendAmount), "ETH (within 33% limit)");
    });

    it("Should prevent agent from exceeding 33% spending limit", async function () {
      const { agent, user1, admin } = await loadFixture(deployAgentFixture);
      
      const agentBalance = await agent.getBalance();
      const maxSpendingLimit = (agentBalance * 33n) / 100n;
      const excessAmount = maxSpendingLimit + ethers.parseEther("0.01"); // Slightly over limit
      
      await agent.connect(admin).grantAgentRole(admin.address);
      
      await expect(
        agent.connect(admin).agentSpend(user1.address, excessAmount, "Excess payment")
      ).to.be.revertedWithCustomError(agent, "ExceedsSpendingLimit");
      
      console.log("✅ Spending limit enforced - prevented excess spending");
    });

    it("Should reset spending limit after 24 hours", async function () {
      const { agent, user1, admin } = await loadFixture(deployAgentFixture);
      
      await agent.connect(admin).grantAgentRole(admin.address);
      
      const agentBalance = await agent.getBalance();
      const maxSpendingLimit = (agentBalance * 33n) / 100n;
      const spendAmount = maxSpendingLimit / 2n; // Use half of limit
      
      // First spend
      await agent.connect(admin).agentSpend(user1.address, spendAmount, "First spend");
      
      // Check remaining limit after first spend
      let remainingLimit = await agent.getRemainingSpendingLimit();
      expect(remainingLimit).to.be.lessThan(maxSpendingLimit);
      
      // Advance time by 24 hours + 1 second
      await time.increase(24 * 60 * 60 + 1);
      
      // Check limit should be reset to 33% of current balance
      remainingLimit = await agent.getRemainingSpendingLimit();
      const currentBalance = await agent.getBalance();
      const expectedLimit = (currentBalance * 33n) / 100n;
      
      // The reset should give us a fresh 33% limit based on current balance
      expect(remainingLimit).to.equal(expectedLimit);
      
      console.log("✅ Spending limit reset after 24 hours");
    });

    it("Should prevent non-agent role from spending", async function () {
      const { agent, user1, user2 } = await loadFixture(deployAgentFixture);
      
      await expect(
        agent.connect(user1).agentSpend(user2.address, ethers.parseEther("0.1"), "Unauthorized")
      ).to.be.revertedWithCustomError(agent, "AccessControlUnauthorizedAccount");
      
      console.log("✅ Non-agent role spending prevented");
    });
  });

  describe("Admin Unlimited Withdrawal", function () {
    it("Should allow admin to withdraw any amount", async function () {
      const { agent, admin, user1 } = await loadFixture(deployAgentFixture);
      
      const agentBalance = await agent.getBalance();
      const withdrawAmount = agentBalance / 2n; // Withdraw 50% (more than 33% limit)
      
      const initialUserBalance = await ethers.provider.getBalance(user1.address);
      
      await expect(
        agent.connect(admin).adminWithdraw(user1.address, withdrawAmount, "Admin withdrawal")
      ).to.emit(agent, "FundsWithdrawn")
        .withArgs(user1.address, withdrawAmount, "Admin withdrawal");
      
      const finalUserBalance = await ethers.provider.getBalance(user1.address);
      expect(finalUserBalance).to.equal(initialUserBalance + withdrawAmount);
      
      const finalAgentBalance = await agent.getBalance();
      expect(finalAgentBalance).to.equal(agentBalance - withdrawAmount);
      
      console.log("✅ Admin withdrew", ethers.formatEther(withdrawAmount), "ETH (unlimited)");
    });

    it("Should allow admin to withdraw entire balance", async function () {
      const { agent, admin } = await loadFixture(deployAgentFixture);
      
      const agentBalance = await agent.getBalance();
      
      await agent.connect(admin).adminWithdraw(admin.address, agentBalance, "Full withdrawal");
      
      expect(await agent.getBalance()).to.equal(0);
      
      console.log("✅ Admin withdrew entire balance");
    });

    it("Should prevent non-admin from withdrawing", async function () {
      const { agent, user1 } = await loadFixture(deployAgentFixture);
      
      await expect(
        agent.connect(user1).adminWithdraw(user1.address, ethers.parseEther("0.1"), "Unauthorized")
      ).to.be.revertedWithCustomError(agent, "OwnableUnauthorizedAccount");
      
      console.log("✅ Non-admin withdrawal prevented");
    });

    it("Should prevent withdrawal of more than available balance", async function () {
      const { agent, admin } = await loadFixture(deployAgentFixture);
      
      const agentBalance = await agent.getBalance();
      const excessAmount = agentBalance + ethers.parseEther("1.0");
      
      await expect(
        agent.connect(admin).adminWithdraw(admin.address, excessAmount, "Excess withdrawal")
      ).to.be.revertedWithCustomError(agent, "InsufficientBalance");
      
      console.log("✅ Insufficient balance check enforced");
    });
  });

  describe("ERC20 Token Deployment - User as Admin", function () {
    it("Should deploy ERC20 token with user as admin", async function () {
      const { agent, admin } = await loadFixture(deployAgentFixture);
      
      await agent.connect(admin).grantAgentRole(admin.address);
      
      const tokenName = "AgentCoin";
      const tokenSymbol = "AGC";
      const initialSupply = ethers.parseUnits("1000000", 18);
      const decimals = 18;
      
      const tx = await agent.connect(admin).deployERC20Token(
        tokenName,
        tokenSymbol,
        initialSupply,
        decimals
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = agent.interface.parseLog(log);
          return parsed.name === "TokenDeployed";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      const tokenAddress = agent.interface.parseLog(event).args[0];
      
      // Verify token details
      const AgentERC20Token = await ethers.getContractFactory("AgentERC20Token");
      const token = AgentERC20Token.attach(tokenAddress);
      
      expect(await token.name()).to.equal(tokenName);
      expect(await token.symbol()).to.equal(tokenSymbol);
      expect(await token.owner()).to.equal(admin.address); // Admin is owner
      expect(await token.creator()).to.equal(await agent.getAddress()); // Agent is creator
      expect(await token.totalSupply()).to.equal(initialSupply * 10n**18n);
      
      // Check deployed tokens list
      const deployedTokens = await agent.getDeployedTokens();
      expect(deployedTokens).to.include(tokenAddress);
      
      console.log("✅ ERC20 Token deployed successfully:");
      console.log("   Address:", tokenAddress);
      console.log("   Name:", await token.name());
      console.log("   Owner:", await token.owner());
      console.log("   Total Supply:", ethers.formatUnits(await token.totalSupply(), 18));
    });

    it("Should allow admin to mint additional tokens", async function () {
      const { agent, admin, user1 } = await loadFixture(deployAgentFixture);
      
      await agent.connect(admin).grantAgentRole(admin.address);
      
      // Deploy token
      const tx = await agent.connect(admin).deployERC20Token(
        "MintableToken",
        "MINT",
        ethers.parseUnits("100000", 18),
        18
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = agent.interface.parseLog(log);
          return parsed.name === "TokenDeployed";
        } catch {
          return false;
        }
      });
      
      const tokenAddress = agent.interface.parseLog(event).args[0];
      const AgentERC20Token = await ethers.getContractFactory("AgentERC20Token");
      const token = AgentERC20Token.attach(tokenAddress);
      
      // Admin can mint more tokens
      const mintAmount = ethers.parseUnits("50000", 18);
      await token.connect(admin).mint(user1.address, mintAmount);
      
      expect(await token.balanceOf(user1.address)).to.equal(mintAmount);
      
      console.log("✅ Admin minted additional tokens to user");
    });

    it("Should prevent non-agent from deploying tokens", async function () {
      const { agent, user1 } = await loadFixture(deployAgentFixture);
      
      await expect(
        agent.connect(user1).deployERC20Token("UnauthorizedToken", "UNAUTH", 1000000, 18)
      ).to.be.revertedWithCustomError(agent, "AccessControlUnauthorizedAccount");
      
      console.log("✅ Non-agent token deployment prevented");
    });
  });

  describe("ERC721 NFT Deployment - User as Admin", function () {
    it("Should deploy NFT collection with user as admin", async function () {
      const { agent, admin } = await loadFixture(deployAgentFixture);
      
      await agent.connect(admin).grantAgentRole(admin.address);
      
      const collectionName = "Agent NFTs";
      const collectionSymbol = "ANFT";
      const baseURI = "https://api.agent.com/metadata/";
      
      const tx = await agent.connect(admin).deployERC721NFT(
        collectionName,
        collectionSymbol,
        baseURI
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = agent.interface.parseLog(log);
          return parsed.name === "NFTDeployed";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      const nftAddress = agent.interface.parseLog(event).args[0];
      
      // Verify NFT details
      const AgentERC721Token = await ethers.getContractFactory("AgentERC721Token");
      const nft = AgentERC721Token.attach(nftAddress);
      
      expect(await nft.name()).to.equal(collectionName);
      expect(await nft.symbol()).to.equal(collectionSymbol);
      expect(await nft.owner()).to.equal(admin.address); // Admin is owner
      expect(await nft.creator()).to.equal(await agent.getAddress()); // Agent is creator
      
      // Check deployed NFTs list
      const deployedNFTs = await agent.getDeployedNFTs();
      expect(deployedNFTs).to.include(nftAddress);
      
      console.log("✅ ERC721 NFT collection deployed successfully:");
      console.log("   Address:", nftAddress);
      console.log("   Name:", await nft.name());
      console.log("   Owner:", await nft.owner());
    });

    it("Should allow admin to mint NFTs", async function () {
      const { agent, admin, user1 } = await loadFixture(deployAgentFixture);
      
      await agent.connect(admin).grantAgentRole(admin.address);
      
      // Deploy NFT collection
      const tx = await agent.connect(admin).deployERC721NFT(
        "Mintable NFTs",
        "MNFT",
        "https://api.mintable.com/"
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = agent.interface.parseLog(log);
          return parsed.name === "NFTDeployed";
        } catch {
          return false;
        }
      });
      
      const nftAddress = agent.interface.parseLog(event).args[0];
      const AgentERC721Token = await ethers.getContractFactory("AgentERC721Token");
      const nft = AgentERC721Token.attach(nftAddress);
      
      // Admin can mint NFTs
      const tokenURI = "1.json"; // Relative URI that will be appended to base URI
      await nft.connect(admin).mint(user1.address, tokenURI);
      
      expect(await nft.ownerOf(1)).to.equal(user1.address);
      expect(await nft.tokenURI(1)).to.equal("https://api.mintable.com/1.json");
      expect(await nft.totalSupply()).to.equal(1);
      
      console.log("✅ Admin minted NFT to user");
    });

    it("Should prevent non-agent from deploying NFTs", async function () {
      const { agent, user1 } = await loadFixture(deployAgentFixture);
      
      await expect(
        agent.connect(user1).deployERC721NFT("UnauthorizedNFT", "UNAUTH", "https://api.com/")
      ).to.be.revertedWithCustomError(agent, "AccessControlUnauthorizedAccount");
      
      console.log("✅ Non-agent NFT deployment prevented");
    });
  });

  describe("Role Management and Access Control", function () {
    it("Should allow admin to grant/revoke agent roles", async function () {
      const { agent, admin, user1 } = await loadFixture(deployAgentFixture);
      
      const AGENT_ROLE = await agent.AGENT_ROLE();
      
      // Grant agent role to user1
      await agent.connect(admin).grantAgentRole(user1.address);
      expect(await agent.hasRole(AGENT_ROLE, user1.address)).to.be.true;
      expect(await agent.isAgent(user1.address)).to.be.true;
      
      // User1 can now spend
      await agent.connect(user1).agentSpend(
        admin.address, 
        ethers.parseEther("0.1"), 
        "Test spend with granted role"
      );
      
      // Revoke agent role
      await agent.connect(admin).revokeAgentRole(user1.address);
      expect(await agent.hasRole(AGENT_ROLE, user1.address)).to.be.false;
      expect(await agent.isAgent(user1.address)).to.be.false;
      
      // User1 can no longer spend
      await expect(
        agent.connect(user1).agentSpend(admin.address, ethers.parseEther("0.1"), "Should fail")
      ).to.be.revertedWithCustomError(agent, "AccessControlUnauthorizedAccount");
      
      console.log("✅ Role management working correctly");
    });

    it("Should prevent non-admin from granting roles", async function () {
      const { agent, user1, user2 } = await loadFixture(deployAgentFixture);
      
      await expect(
        agent.connect(user1).grantAgentRole(user2.address)
      ).to.be.revertedWithCustomError(agent, "OwnableUnauthorizedAccount");
      
      console.log("✅ Non-admin role granting prevented");
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow admin to emergency withdraw all funds", async function () {
      const { agent, admin } = await loadFixture(deployAgentFixture);
      
      const agentBalance = await agent.getBalance();
      const initialAdminBalance = await ethers.provider.getBalance(admin.address);
      
      const tx = await agent.connect(admin).emergencyWithdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalAdminBalance = await ethers.provider.getBalance(admin.address);
      const finalAgentBalance = await agent.getBalance();
      
      expect(finalAgentBalance).to.equal(0);
      expect(finalAdminBalance).to.be.closeTo(
        initialAdminBalance + agentBalance - gasUsed,
        ethers.parseEther("0.0001")
      );
      
      console.log("✅ Emergency withdrawal successful");
    });

    it("Should allow admin to pause/unpause agent", async function () {
      const { agent, admin, user1 } = await loadFixture(deployAgentFixture);
      
      await agent.connect(admin).grantAgentRole(admin.address);
      
      // Pause the agent
      await agent.connect(admin).pause();
      
      // Agent spending should fail when paused
      await expect(
        agent.connect(admin).agentSpend(user1.address, ethers.parseEther("0.1"), "Should fail")
      ).to.be.revertedWithCustomError(agent, "EnforcedPause");
      
      // Unpause the agent
      await agent.connect(admin).unpause();
      
      // Agent spending should work after unpause
      await agent.connect(admin).agentSpend(user1.address, ethers.parseEther("0.1"), "Should work");
      
      console.log("✅ Pause/unpause functionality working");
    });

    it("Should allow admin to update agent info", async function () {
      const { agent, admin } = await loadFixture(deployAgentFixture);
      
      const newName = "Updated Agent Name";
      const newDescription = "Updated agent description";
      
      await expect(
        agent.connect(admin).updateAgentInfo(newName, newDescription)
      ).to.emit(agent, "AgentInfoUpdated")
        .withArgs(newName, newDescription);
      
      const agentInfo = await agent.getAgentInfo();
      expect(agentInfo.name).to.equal(newName);
      expect(agentInfo.description).to.equal(newDescription);
      
      console.log("✅ Agent info updated successfully");
    });
  });

  describe("Integration Test - Complete Workflow", function () {
    it("Should demonstrate complete agent lifecycle", async function () {
      const { agent, admin, user1, user2 } = await loadFixture(deployAgentFixture);
      
      console.log("\n🔄 Starting complete agent workflow test...");
      
      // Step 1: Admin funds the agent additionally
      await agent.connect(admin).adminFund({ value: ethers.parseEther("0.5") });
      console.log("1️⃣ Admin funded agent with additional 0.5 ETH");
      
      // Step 2: User1 also funds the agent
      await user1.sendTransaction({
        to: await agent.getAddress(),
        value: ethers.parseEther("0.3")
      });
      console.log("2️⃣ User1 donated 0.3 ETH to agent");
      
      // Step 3: Grant agent role to admin
      await agent.connect(admin).grantAgentRole(admin.address);
      console.log("3️⃣ Admin granted agent role to themselves");
      
      // Step 4: Deploy ERC20 token
      const tokenTx = await agent.connect(admin).deployERC20Token(
        "WorkflowToken", "WFT", ethers.parseUnits("2000000", 18), 18
      );
      const tokenReceipt = await tokenTx.wait();
      const tokenEvent = tokenReceipt.logs.find(log => {
        try {
          return agent.interface.parseLog(log).name === "TokenDeployed";
        } catch {
          return false;
        }
      });
      const tokenAddress = agent.interface.parseLog(tokenEvent).args[0];
      console.log("4️⃣ Deployed ERC20 token at:", tokenAddress);
      
      // Step 5: Deploy NFT collection
      const nftTx = await agent.connect(admin).deployERC721NFT(
        "Workflow NFTs", "WFNFT", "https://api.workflow.com/"
      );
      const nftReceipt = await nftTx.wait();
      const nftEvent = nftReceipt.logs.find(log => {
        try {
          return agent.interface.parseLog(log).name === "NFTDeployed";
        } catch {
          return false;
        }
      });
      const nftAddress = agent.interface.parseLog(nftEvent).args[0];
      console.log("5️⃣ Deployed NFT collection at:", nftAddress);
      
      // Step 6: Agent spending (within 33% limit)
      const agentBalance = await agent.getBalance();
      const spendAmount = (agentBalance * 20n) / 100n; // Spend 20% (under 33% limit)
      
      await agent.connect(admin).agentSpend(user2.address, spendAmount, "Workflow payment");
      console.log("6️⃣ Agent spent", ethers.formatEther(spendAmount), "ETH to user2");
      
      // Step 7: Admin withdrawal (unlimited)
      const withdrawAmount = ethers.parseEther("0.5");
      await agent.connect(admin).adminWithdraw(admin.address, withdrawAmount, "Profit withdrawal");
      console.log("7️⃣ Admin withdrew", ethers.formatEther(withdrawAmount), "ETH");
      
      // Final verification
      const finalInfo = await agent.getAgentInfo();
      const deployedTokens = await agent.getDeployedTokens();
      const deployedNFTs = await agent.getDeployedNFTs();
      
      console.log("\n✅ Workflow completed successfully!");
      console.log("   Final balance:", ethers.formatEther(finalInfo.balance), "ETH");
      console.log("   Deployed tokens:", deployedTokens.length);
      console.log("   Deployed NFTs:", deployedNFTs.length);
      console.log("   Remaining spending limit:", ethers.formatEther(finalInfo.remainingSpendingLimit), "ETH");
      
      // All functionality verified
      expect(deployedTokens).to.include(tokenAddress);
      expect(deployedNFTs).to.include(nftAddress);
      expect(finalInfo.balance).to.be.greaterThan(0);
    });
  });
});
