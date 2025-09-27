export { Agent } from './Agent';
export { Memory } from './Memory';
export { Chat } from './Chat';
export { ZGStorageClientImpl } from './ZGStorageClient';
export { ZGComputeBrokerImpl, createZGComputeNetworkBroker } from './ZGComputeBroker';
export type { ChatMessage, ChatCompletionRequest, ChatCompletionResponse, ServiceMetadata, MemoryItem, AgentConfig, ZGStorageClient, ZGComputeBroker } from './types';
export { Indexer, ZgFile, KvClient, Batcher } from "@0glabs/0g-ts-sdk";
export declare function createAgent(config: {
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
}): Promise<any>;
//# sourceMappingURL=index.d.ts.map