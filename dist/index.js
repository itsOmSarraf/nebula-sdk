"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Batcher = exports.KvClient = exports.ZgFile = exports.Indexer = exports.createZGComputeNetworkBroker = exports.ZGComputeBrokerImpl = exports.ZGStorageClientImpl = exports.Chat = exports.Memory = exports.Agent = void 0;
exports.createAgent = createAgent;
// Main exports
var Agent_1 = require("./Agent");
Object.defineProperty(exports, "Agent", { enumerable: true, get: function () { return Agent_1.Agent; } });
var Memory_1 = require("./Memory");
Object.defineProperty(exports, "Memory", { enumerable: true, get: function () { return Memory_1.Memory; } });
var Chat_1 = require("./Chat");
Object.defineProperty(exports, "Chat", { enumerable: true, get: function () { return Chat_1.Chat; } });
var ZGStorageClient_1 = require("./ZGStorageClient");
Object.defineProperty(exports, "ZGStorageClientImpl", { enumerable: true, get: function () { return ZGStorageClient_1.ZGStorageClientImpl; } });
var ZGComputeBroker_1 = require("./ZGComputeBroker");
Object.defineProperty(exports, "ZGComputeBrokerImpl", { enumerable: true, get: function () { return ZGComputeBroker_1.ZGComputeBrokerImpl; } });
Object.defineProperty(exports, "createZGComputeNetworkBroker", { enumerable: true, get: function () { return ZGComputeBroker_1.createZGComputeNetworkBroker; } });
// Re-export specific 0G Labs dependencies for convenience
var _0g_ts_sdk_1 = require("@0glabs/0g-ts-sdk");
Object.defineProperty(exports, "Indexer", { enumerable: true, get: function () { return _0g_ts_sdk_1.Indexer; } });
Object.defineProperty(exports, "ZgFile", { enumerable: true, get: function () { return _0g_ts_sdk_1.ZgFile; } });
Object.defineProperty(exports, "KvClient", { enumerable: true, get: function () { return _0g_ts_sdk_1.KvClient; } });
Object.defineProperty(exports, "Batcher", { enumerable: true, get: function () { return _0g_ts_sdk_1.Batcher; } });
// Utility function to create a pre-configured agent
async function createAgent(config) {
    const { ethers } = await import("ethers");
    // Default endpoints
    const rpcUrl = config.rpcUrl || "https://evmrpc-testnet.0g.ai";
    const indexerRpc = config.indexerRpc || "https://indexer-storage-testnet-turbo.0g.ai";
    const kvRpc = config.kvRpc || "http://3.101.147.150:6789";
    // Create wallet and signer
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(config.privateKey, provider);
    // Create storage client
    const storageClient = new ZGStorageClientImpl(indexerRpc, kvRpc, rpcUrl, signer, config.memoryBucket);
    // Create compute broker
    const broker = createZGComputeNetworkBroker(rpcUrl);
    const agentConfig = {
        name: config.name,
        providerAddress: config.providerAddress,
        memoryBucket: config.memoryBucket,
        maxEphemeralMessages: config.maxEphemeralMessages || 50,
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || 1000
    };
    const agent = new Agent(agentConfig, broker, storageClient);
    await agent.init();
    return agent;
}
//# sourceMappingURL=index.js.map