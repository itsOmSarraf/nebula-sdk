// Main exports
export { Agent } from './Agent';
export { Memory } from './Memory';
export { Chat } from './Chat';
export { ZGStorageClientImpl } from './ZGStorageClient';
export { ZGComputeBrokerImpl, createZGComputeNetworkBroker } from './ZGComputeBroker';

// Type exports
export type {
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ServiceMetadata,
  MemoryItem,
  AgentConfig,
  ZGStorageClient,
  ZGComputeBroker
} from './types';

// Re-export specific 0G Labs dependencies for convenience
export { Indexer, ZgFile, KvClient, Batcher } from "@0glabs/0g-ts-sdk";

// Utility function to create a pre-configured agent
export async function createAgent(config: {
  name: string;
  providerAddress: string;
  memoryBucket: string;
  privateKey: string;
  rpcUrl?: string;
  indexerRpc?: string;
  kvRpc?: string;
  maxEphemeralMessages?: number;
  temperature?: number;
  maxTokens?: number;
}) {
  const { ethers } = await import("ethers");
  
  // Default endpoints
  const rpcUrl = config.rpcUrl || "https://evmrpc-testnet.0g.ai";
  const indexerRpc = config.indexerRpc || "https://indexer-storage-testnet-turbo.0g.ai";
  const kvRpc = config.kvRpc || "http://3.101.147.150:6789";
  
  // Create wallet and signer
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(config.privateKey, provider);
  
  // Create storage client
  const storageClient = new ZGStorageClientImpl(
    indexerRpc,
    kvRpc,
    rpcUrl,
    signer,
    config.memoryBucket
  );
  
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
