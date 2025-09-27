require("@nomicfoundation/hardhat-toolbox");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 800 // Higher runs for smaller deployment size
      },
      evmVersion: "paris", // Compatible with most networks including 0G
      viaIR: true // Enable via-IR compilation for better optimization
    }
  },
  networks: {
    // 0G Testnet
    galileoTestnet: {
      url: "https://evmrpc-testnet.0g.ai",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 16602,
      gasPrice: "auto",
      gas: "auto"
    },
    // 0G Mainnet (when available)
    zerog: {
      url: "https://evmrpc.0g.ai", // This might change when mainnet launches
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 16601, // This might change when mainnet launches
      gasPrice: "auto",
      gas: "auto"
    },
    // Local development
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: [':AgentContract$', ':AgentFactory$', ':AgentERC20Factory$', ':AgentERC721Factory$']
  },
  mocha: {
    timeout: 100000
  }
};
