const { ethers } = require("hardhat");

/**
 * Deployment script optimized for SDK integration
 * This script deploys the factory and provides all information needed for the SDK
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Deploying 0G AI Agent Contracts for SDK Integration");
  console.log("====================================================");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
  
  // Configuration
  const deploymentFee = ethers.parseEther("0.001"); // 0.001 ETH per agent deployment
  
  // Deploy the factory (includes all implementations)
  console.log("\n📦 Deploying AgentFactory...");
  const AgentFactory = await ethers.getContractFactory("AgentFactory");
  const factory = await AgentFactory.deploy(deploymentFee);
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  console.log("✅ AgentFactory deployed:", factoryAddress);
  
  // Get implementation addresses
  const addresses = await factory.getImplementationAddresses();
  console.log("✅ AgentImplementation deployed:", addresses.implementation);
  console.log("✅ ERC20Factory deployed:", addresses.tokenFactory);
  console.log("✅ ERC721Factory deployed:", addresses.nftFactory);
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  const blockNumber = await ethers.provider.getBlockNumber();
  
  // Create SDK configuration
  const sdkConfig = {
    // Network information
    network: {
      name: network.name || "unknown",
      chainId: Number(network.chainId),
      rpcUrl: "https://evmrpc-testnet.0g.ai", // 0G testnet RPC
      blockExplorer: "https://explorer-testnet.0g.ai"
    },
    
    // Contract addresses (what the SDK needs)
    contracts: {
      agentFactory: factoryAddress,
      agentImplementation: addresses.implementation,
      erc20Factory: addresses.tokenFactory,
      erc721Factory: addresses.nftFactory
    },
    
    // Configuration parameters
    config: {
      deploymentFeeWei: deploymentFee.toString(),
      deploymentFeeEth: ethers.formatEther(deploymentFee),
      spendingLimitPercentage: 33,
      spendingResetPeriodHours: 24,
      maxAgentNameLength: 50,
      maxDescriptionLength: 500
    },
    
    // Deployment metadata
    deployment: {
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      blockNumber: blockNumber,
      txHash: factory.deploymentTransaction()?.hash || "unknown"
    }
  };
  
  // Save SDK configuration
  const fs = require('fs');
  const configFilename = `sdk-config-${network.chainId}.json`;
  fs.writeFileSync(configFilename, JSON.stringify(sdkConfig, null, 2));
  
  console.log(`\n💾 SDK configuration saved to: ${configFilename}`);
  
  // Display SDK integration info
  console.log("\n🛠️ SDK INTEGRATION INSTRUCTIONS:");
  console.log("================================");
  console.log("1. Copy the contract addresses below to your SDK configuration:");
  console.log(`   Factory: ${factoryAddress}`);
  console.log(`   Implementation: ${addresses.implementation}`);
  console.log(`   ERC20 Factory: ${addresses.tokenFactory}`);
  console.log(`   ERC721 Factory: ${addresses.nftFactory}`);
  console.log("");
  console.log("2. Use these in your TypeScript SDK:");
  console.log("");
  console.log("```typescript");
  console.log("export const AGENT_CONTRACTS = {");
  console.log(`  FACTORY_ADDRESS: "${factoryAddress}",`);
  console.log(`  IMPLEMENTATION_ADDRESS: "${addresses.implementation}",`);
  console.log(`  DEPLOYMENT_FEE: "${ethers.formatEther(deploymentFee)}", // ETH`);
  console.log(`  SPENDING_LIMIT_PERCENTAGE: 33,`);
  console.log(`  SPENDING_RESET_PERIOD_HOURS: 24`);
  console.log("};");
  console.log("```");
  console.log("");
  console.log("3. SDK Usage Example:");
  console.log("");
  console.log("```typescript");
  console.log("import { ethers } from 'ethers';");
  console.log("import { AGENT_CONTRACTS } from './config';");
  console.log("");
  console.log("class AgentSDK {");
  console.log("  async deployAgent(name: string, description: string, initialFunding?: string) {");
  console.log("    const factory = new ethers.Contract(");
  console.log(`      "${factoryAddress}",`);
  console.log("      FACTORY_ABI,");
  console.log("      signer");
  console.log("    );");
  console.log("");
  console.log("    const deploymentFee = ethers.parseEther(AGENT_CONTRACTS.DEPLOYMENT_FEE);");
  console.log("    const funding = initialFunding ? ethers.parseEther(initialFunding) : 0n;");
  console.log("    const totalValue = deploymentFee + funding;");
  console.log("");
  console.log("    const tx = await factory.deployAgentWithFunding(");
  console.log("      name,");
  console.log("      description,");
  console.log("      funding,");
  console.log("      { value: totalValue }");
  console.log("    );");
  console.log("");
  console.log("    const receipt = await tx.wait();");
  console.log("    // Parse events to get agent address");
  console.log("    return agentAddress;");
  console.log("  }");
  console.log("");
  console.log("  async getAgentContract(agentAddress: string) {");
  console.log("    return new ethers.Contract(");
  console.log("      agentAddress,");
  console.log(`      AGENT_IMPLEMENTATION_ABI, // Use AgentImplementation ABI`);
  console.log("      signer");
  console.log("    );");
  console.log("  }");
  console.log("}");
  console.log("```");
  
  console.log("\n📋 QUICK REFERENCE:");
  console.log("==================");
  console.log("To deploy an agent from SDK:");
  console.log(`1. Send ${ethers.formatEther(deploymentFee)} ETH + initial funding to factory.deployAgentWithFunding()`);
  console.log("2. Parse AgentDeployed event to get agent proxy address");
  console.log("3. Use AgentImplementation ABI to interact with agent proxy");
  console.log("");
  console.log("Core agent functions available:");
  console.log("• agentSpend() - Spend up to 33% of balance");
  console.log("• adminWithdraw() - Unlimited withdrawal (admin only)");
  console.log("• deposit() - Accept funding from anyone");
  console.log("• deployERC20Token() - Deploy tokens with user as admin");
  console.log("• deployERC721NFT() - Deploy NFTs with user as admin");
  console.log("• grantAgentRole() / revokeAgentRole() - Role management");
  console.log("• pause() / unpause() - Emergency controls");
  
  console.log("\n🔗 Contract Verification:");
  console.log(`npx hardhat verify --network <network> ${factoryAddress} "${deploymentFee}"`);
  
  console.log("\n✅ READY FOR SDK INTEGRATION!");
  console.log("All contracts deployed and optimized for production use.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ SDK Deployment failed:", error);
    process.exit(1);
  });
