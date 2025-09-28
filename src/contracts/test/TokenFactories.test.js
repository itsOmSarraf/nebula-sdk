const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Token Factories - ERC20 and ERC721", function () {
  // Test fixture for token factories
  async function deployTokenFactoriesFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();
    
    // Deploy ERC20 Factory
    const AgentERC20Factory = await ethers.getContractFactory("AgentERC20Factory");
    const erc20Factory = await AgentERC20Factory.deploy();
    await erc20Factory.waitForDeployment();
    
    // Deploy ERC721 Factory
    const AgentERC721Factory = await ethers.getContractFactory("AgentERC721Factory");
    const erc721Factory = await AgentERC721Factory.deploy();
    await erc721Factory.waitForDeployment();
    
    return {
      erc20Factory,
      erc721Factory,
      owner,
      user1,
      user2,
      user3
    };
  }

  describe("ERC20 Token Factory", function () {
    it("Should create ERC20 token successfully", async function () {
      const { erc20Factory, user1, user2 } = await loadFixture(deployTokenFactoriesFixture);
      
      const tokenName = "Test Token";
      const tokenSymbol = "TEST";
      const initialSupply = 1000000;
      const decimals = 18;
      
      const tx = await erc20Factory.connect(user1).createToken(
        tokenName,
        tokenSymbol,
        initialSupply,
        decimals,
        user2.address // user2 will be the owner
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = erc20Factory.interface.parseLog(log);
          return parsed.name === "TokenCreated";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      const parsedEvent = erc20Factory.interface.parseLog(event);
      const tokenAddress = parsedEvent.args[0];
      
      // Verify token properties
      const AgentERC20Token = await ethers.getContractFactory("AgentERC20Token");
      const token = AgentERC20Token.attach(tokenAddress);
      
      expect(await token.name()).to.equal(tokenName);
      expect(await token.symbol()).to.equal(tokenSymbol);
      expect(await token.decimals()).to.equal(decimals);
      expect(await token.owner()).to.equal(user2.address);
      expect(await token.creator()).to.equal(user1.address);
      expect(await token.totalSupply()).to.equal(ethers.parseUnits(initialSupply.toString(), decimals));
      
      // Check factory tracking
      const totalTokens = await erc20Factory.getTotalTokensCreated();
      expect(totalTokens).to.equal(1);
      
      const allTokens = await erc20Factory.getAllCreatedTokens();
      expect(allTokens).to.include(tokenAddress);
      
      const creatorTokens = await erc20Factory.getTokensByCreator(user1.address);
      expect(creatorTokens).to.include(tokenAddress);
      
      expect(await erc20Factory.isTokenCreatedByFactory(tokenAddress)).to.be.true;
      
      console.log("✅ ERC20 token created successfully:");
      console.log("   Address:", tokenAddress);
      console.log("   Name:", await token.name());
      console.log("   Owner:", await token.owner());
      console.log("   Total Supply:", ethers.formatUnits(await token.totalSupply(), decimals));
    });

    it("Should allow token owner to mint and manage token", async function () {
      const { erc20Factory, user1, user2, user3 } = await loadFixture(deployTokenFactoriesFixture);
      
      // Create token
      const tx = await erc20Factory.connect(user1).createToken(
        "Manageable Token",
        "MGMT",
        500000,
        18,
        user2.address
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = erc20Factory.interface.parseLog(log);
          return parsed.name === "TokenCreated";
        } catch {
          return false;
        }
      });
      
      const tokenAddress = erc20Factory.interface.parseLog(event).args[0];
      const AgentERC20Token = await ethers.getContractFactory("AgentERC20Token");
      const token = AgentERC20Token.attach(tokenAddress);
      
      // Owner can set description
      await token.connect(user2).setTokenDescription("A manageable test token");
      expect(await token.getTokenDescription()).to.equal("A manageable test token");
      
      // Owner can mint additional tokens
      const mintAmount = ethers.parseEther("100000");
      await token.connect(user2).mint(user3.address, mintAmount);
      expect(await token.balanceOf(user3.address)).to.equal(mintAmount);
      
      // Owner can pause/unpause
      await token.connect(user2).pause();
      
      // Transfers should fail when paused
      await expect(
        token.connect(user3).transfer(user1.address, ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
      
      // Unpause
      await token.connect(user2).unpause();
      
      // Transfers should work after unpause
      await token.connect(user3).transfer(user1.address, ethers.parseEther("1000"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
      
      console.log("✅ Token owner management functions working");
    });

    it("Should prevent invalid token creation", async function () {
      const { erc20Factory, user1 } = await loadFixture(deployTokenFactoriesFixture);
      
      // Empty name
      await expect(
        erc20Factory.connect(user1).createToken("", "TEST", 1000000, 18, user1.address)
      ).to.be.revertedWith("Invalid params");
      
      // Empty symbol
      await expect(
        erc20Factory.connect(user1).createToken("Test", "", 1000000, 18, user1.address)
      ).to.be.revertedWith("Invalid params");
      
      // Zero supply
      await expect(
        erc20Factory.connect(user1).createToken("Test", "TEST", 0, 18, user1.address)
      ).to.be.revertedWith("Invalid params");
      
      // Invalid decimals
      await expect(
        erc20Factory.connect(user1).createToken("Test", "TEST", 1000000, 25, user1.address)
      ).to.be.revertedWith("Invalid params");
      
      // Zero address owner
      await expect(
        erc20Factory.connect(user1).createToken("Test", "TEST", 1000000, 18, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid params");
      
      console.log("✅ Invalid token creation properly prevented");
    });
  });

  describe("ERC721 NFT Factory", function () {
    it("Should create NFT collection successfully", async function () {
      const { erc721Factory, user1, user2 } = await loadFixture(deployTokenFactoriesFixture);
      
      const collectionName = "Test NFTs";
      const collectionSymbol = "TNFT";
      const baseURI = "https://api.testnft.com/";
      
      const tx = await erc721Factory.connect(user1).createNFT(
        collectionName,
        collectionSymbol,
        baseURI,
        user2.address // user2 will be the owner
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = erc721Factory.interface.parseLog(log);
          return parsed.name === "NFTCollectionCreated";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      const parsedEvent = erc721Factory.interface.parseLog(event);
      const nftAddress = parsedEvent.args[0];
      
      // Verify NFT collection properties
      const AgentERC721Token = await ethers.getContractFactory("AgentERC721Token");
      const nft = AgentERC721Token.attach(nftAddress);
      
      expect(await nft.name()).to.equal(collectionName);
      expect(await nft.symbol()).to.equal(collectionSymbol);
      expect(await nft.owner()).to.equal(user2.address);
      expect(await nft.creator()).to.equal(user1.address);
      
      // Check factory tracking
      const totalNFTs = await erc721Factory.getTotalNFTsCreated();
      expect(totalNFTs).to.equal(1);
      
      const allNFTs = await erc721Factory.getAllCreatedNFTs();
      expect(allNFTs).to.include(nftAddress);
      
      const creatorNFTs = await erc721Factory.getNFTsByCreator(user1.address);
      expect(creatorNFTs).to.include(nftAddress);
      
      expect(await erc721Factory.isNFTCreatedByFactory(nftAddress)).to.be.true;
      
      console.log("✅ NFT collection created successfully:");
      console.log("   Address:", nftAddress);
      console.log("   Name:", await nft.name());
      console.log("   Owner:", await nft.owner());
    });

    it("Should allow NFT owner to mint and manage collection", async function () {
      const { erc721Factory, user1, user2, user3 } = await loadFixture(deployTokenFactoriesFixture);
      
      // Create NFT collection
      const tx = await erc721Factory.connect(user1).createNFT(
        "Manageable NFTs",
        "MNFT",
        "https://api.manageable.com/",
        user2.address
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = erc721Factory.interface.parseLog(log);
          return parsed.name === "NFTCollectionCreated";
        } catch {
          return false;
        }
      });
      
      const nftAddress = erc721Factory.interface.parseLog(event).args[0];
      const AgentERC721Token = await ethers.getContractFactory("AgentERC721Token");
      const nft = AgentERC721Token.attach(nftAddress);
      
      // Owner can set description
      await nft.connect(user2).setCollectionDescription("A manageable NFT collection");
      expect(await nft.getCollectionDescription()).to.equal("A manageable NFT collection");
      
      // Owner can set max supply
      await nft.connect(user2).setMaxSupply(10000);
      expect(await nft.maxSupply()).to.equal(10000);
      
      // Owner can mint NFT
      const tokenURI = "1.json"; // Relative URI that will be appended to base URI
      const mintTx = await nft.connect(user2).mint(user3.address, tokenURI);
      const mintReceipt = await mintTx.wait();
      
      expect(await nft.ownerOf(1)).to.equal(user3.address);
      expect(await nft.tokenURI(1)).to.equal("https://api.manageable.com/1.json");
      expect(await nft.totalSupply()).to.equal(1);
      
      // Owner can batch mint
      const recipients = [user1.address, user2.address, user3.address];
      const uris = [
        "2.json", // Relative URIs that will be appended to base URI
        "3.json", 
        "4.json"
      ];
      
      const batchTx = await nft.connect(user2).batchMint(recipients, uris);
      await batchTx.wait();
      
      expect(await nft.totalSupply()).to.equal(4);
      expect(await nft.ownerOf(2)).to.equal(user1.address);
      expect(await nft.ownerOf(3)).to.equal(user2.address);
      expect(await nft.ownerOf(4)).to.equal(user3.address);
      
      // Owner can set royalty
      await nft.connect(user2).setRoyalty(user2.address, 750); // 7.5%
      const [receiver, royaltyAmount] = await nft.royaltyInfo(1, ethers.parseEther("1"));
      expect(receiver).to.equal(user2.address);
      expect(royaltyAmount).to.equal(ethers.parseEther("0.075"));
      
      // Owner can pause/unpause
      await nft.connect(user2).pause();
      
      // Transfers should fail when paused
      await expect(
        nft.connect(user3)["safeTransferFrom(address,address,uint256)"](user3.address, user1.address, 1)
      ).to.be.revertedWithCustomError(nft, "EnforcedPause");
      
      // Unpause
      await nft.connect(user2).unpause();
      
      // Transfers should work after unpause
      await nft.connect(user3)["safeTransferFrom(address,address,uint256)"](user3.address, user1.address, 1);
      expect(await nft.ownerOf(1)).to.equal(user1.address);
      
      console.log("✅ NFT collection owner management functions working");
    });

    it("Should prevent invalid NFT creation", async function () {
      const { erc721Factory, user1 } = await loadFixture(deployTokenFactoriesFixture);
      
      // Empty name
      await expect(
        erc721Factory.connect(user1).createNFT("", "TEST", "https://api.com/", user1.address)
      ).to.be.revertedWith("Invalid params");
      
      // Empty symbol
      await expect(
        erc721Factory.connect(user1).createNFT("Test", "", "https://api.com/", user1.address)
      ).to.be.revertedWith("Invalid params");
      
      // Zero address owner
      await expect(
        erc721Factory.connect(user1).createNFT("Test", "TEST", "https://api.com/", ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid params");
      
      console.log("✅ Invalid NFT creation properly prevented");
    });

    it("Should handle advanced NFT features", async function () {
      const { erc721Factory, user1, user2, user3 } = await loadFixture(deployTokenFactoriesFixture);
      
      // Create NFT collection
      const tx = await erc721Factory.connect(user1).createNFT(
        "Advanced NFTs",
        "ADVNFT",
        "https://api.advanced.com/",
        user2.address
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = erc721Factory.interface.parseLog(log);
          return parsed.name === "NFTCollectionCreated";
        } catch {
          return false;
        }
      });
      
      const nftAddress = erc721Factory.interface.parseLog(event).args[0];
      const AgentERC721Token = await ethers.getContractFactory("AgentERC721Token");
      const nft = AgentERC721Token.attach(nftAddress);
      
      // Set max supply
      await nft.connect(user2).setMaxSupply(5);
      
      // Mint up to max supply
      for (let i = 1; i <= 5; i++) {
        await nft.connect(user2).mint(user3.address, `${i}.json`); // Relative URIs
      }
      
      expect(await nft.totalSupply()).to.equal(5);
      
      // Should fail to mint beyond max supply
      await expect(
        nft.connect(user2).mint(user3.address, "6.json")
      ).to.be.revertedWith("Invalid mint");
      
      // Test burning - note: totalSupply tracks _nextTokenId - 1, not actual existing tokens
      await nft.connect(user3).burn(1);
      expect(await nft.totalSupply()).to.equal(5); // totalSupply doesn't decrease on burn in this implementation
      
      // Should fail to query burned token
      await expect(nft.ownerOf(1)).to.be.reverted;
      
      // Test royalty for non-existent token
      await expect(nft.royaltyInfo(1, ethers.parseEther("1"))).to.be.revertedWith("Token not exist");
      
      console.log("✅ Advanced NFT features working correctly");
    });
  });

  describe("Factory Integration", function () {
    it("Should track multiple tokens from different creators", async function () {
      const { erc20Factory, erc721Factory, user1, user2, user3 } = await loadFixture(deployTokenFactoriesFixture);
      
      // User1 creates tokens
      await erc20Factory.connect(user1).createToken("Token1", "TK1", 1000000, 18, user1.address);
      await erc20Factory.connect(user1).createToken("Token2", "TK2", 2000000, 18, user1.address);
      await erc721Factory.connect(user1).createNFT("NFT1", "NF1", "https://api1.com/", user1.address);
      
      // User2 creates tokens  
      await erc20Factory.connect(user2).createToken("Token3", "TK3", 3000000, 18, user2.address);
      await erc721Factory.connect(user2).createNFT("NFT2", "NF2", "https://api2.com/", user2.address);
      await erc721Factory.connect(user2).createNFT("NFT3", "NF3", "https://api3.com/", user2.address);
      
      // Check totals
      expect(await erc20Factory.getTotalTokensCreated()).to.equal(3);
      expect(await erc721Factory.getTotalNFTsCreated()).to.equal(3);
      
      // Check per-creator counts
      const user1Tokens = await erc20Factory.getTokensByCreator(user1.address);
      const user1NFTs = await erc721Factory.getNFTsByCreator(user1.address);
      const user2Tokens = await erc20Factory.getTokensByCreator(user2.address);
      const user2NFTs = await erc721Factory.getNFTsByCreator(user2.address);
      
      expect(user1Tokens.length).to.equal(2);
      expect(user1NFTs.length).to.equal(1);
      expect(user2Tokens.length).to.equal(1);
      expect(user2NFTs.length).to.equal(2);
      
      console.log("✅ Factory tracking working correctly:");
      console.log("   Total ERC20 tokens:", await erc20Factory.getTotalTokensCreated());
      console.log("   Total NFT collections:", await erc721Factory.getTotalNFTsCreated());
      console.log("   User1 tokens:", user1Tokens.length);
      console.log("   User2 NFTs:", user2NFTs.length);
    });
  });
});
