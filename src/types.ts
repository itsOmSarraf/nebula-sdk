export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  choices: Array<{
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ServiceMetadata {
  endpoint: string;
  model: string;
  provider: string;
}

export interface MemoryItem {
  key: string;
  value: any;
  timestamp: Date;
  type: 'ephemeral' | 'persistent';
}

export interface AgentConfig {
  name: string;
  providerAddress: string;
  memoryBucket: string;
  maxEphemeralMessages?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface ZGStorageClient {
  upload(data: string | Buffer, fileName: string): Promise<string>; // Returns root hash
  download(rootHash: string): Promise<Buffer>;
  uploadKV(streamId: string, key: string, value: any): Promise<string>; // Returns transaction hash
  downloadKV(streamId: string, key: string): Promise<any>;
}

export interface ZGComputeBroker {
  inference: {
    getServiceMetadata(providerAddress: string): Promise<ServiceMetadata>;
    getRequestHeaders(providerAddress: string, content: string): Promise<Record<string, string>>;
  };
}
