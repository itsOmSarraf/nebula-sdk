# 0G AI SDK

A TypeScript SDK for building AI agents with 0G Network's compute and storage infrastructure.

## Features

- **Chat Interface**: Seamless integration with 0G Compute for LLM interactions
- **Memory Management**: Both ephemeral (in-memory) and persistent (0G Storage) memory
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Streaming Support**: Real-time streaming chat completions
- **Conversation Management**: Save, load, and manage conversation history

## Installation

```bash
npm install 0g-ai-sdk
```

## Quick Start

```typescript
import { createAgent } from '0g-ai-sdk';

// Create and initialize an agent
const agent = await createAgent({
  name: "MyAgent",
  providerAddress: "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
  memoryBucket: "my-agent-memory",
  privateKey: "your-private-key-here", // Required for 0G Storage
  temperature: 0.7,
  maxTokens: 1000
});

// Simple chat
const response = await agent.ask("Hello, who are you?");
console.log(response);

// Chat with conversation context
const contextResponse = await agent.chatWithContext("What did I just ask you?");
console.log(contextResponse);

// Remember something persistently
await agent.remember("userName", "Om");
const name = await agent.recall("userName");
console.log(name); // "Om"
```

## Advanced Usage

### Manual Agent Creation

```typescript
import { Agent, createZGComputeNetworkBroker, ZGStorageClientImpl } from '0g-ai-sdk';
import { ethers } from 'ethers';

// Setup wallet and providers
const provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
const signer = new ethers.Wallet("your-private-key", provider);

// Create storage client
const storageClient = new ZGStorageClientImpl(
  "https://indexer-storage-testnet-turbo.0g.ai", // Indexer RPC
  "http://3.101.147.150:6789", // KV RPC
  "https://evmrpc-testnet.0g.ai", // Chain RPC
  signer,
  "advanced-memory" // Stream ID for KV storage
);

// Create compute broker
const broker = createZGComputeNetworkBroker();

const agent = new Agent({
  name: "AdvancedAgent",
  providerAddress: "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
  memoryBucket: "advanced-memory",
  maxEphemeralMessages: 100,
  temperature: 0.8,
  maxTokens: 2000
}, broker, storageClient);

await agent.init();
```

### Streaming Chat

```typescript
const response = await agent.streamChat("Tell me a story", (chunk) => {
  process.stdout.write(chunk);
});
```

### System Prompts

```typescript
agent.setSystemPrompt("You are a helpful AI assistant specialized in blockchain technology.");
await agent.saveSystemPrompt(); // Persist the system prompt
```

### Conversation Management

```typescript
// Save current conversation
const conversationId = await agent.saveConversation();

// Load a previous conversation
await agent.loadConversation(conversationId);

// Clear current conversation
agent.clearConversation();
```

### Memory Operations

```typescript
// Ephemeral memory (lost when agent is destroyed)
agent.memory.setEphemeral("tempData", { key: "value" });
const tempData = agent.memory.getEphemeral("tempData");

// Persistent memory (stored in 0G Storage)
await agent.memory.remember("importantData", { user: "Om", preferences: ["AI", "blockchain"] });
const importantData = await agent.memory.recall("importantData");

// Get conversation context
const context = agent.memory.getConversationContext();
console.log(context);
```

## API Reference

### Agent Class

#### Constructor
```typescript
new Agent(config: AgentConfig, broker: ZGComputeBroker)
```

#### Methods
- `init()`: Initialize the agent
- `chat(input: string)`: Simple chat without context
- `chatWithContext(input: string)`: Chat with full conversation context
- `streamChat(input: string, onChunk: (chunk: string) => void)`: Streaming chat
- `remember(key: string, value: any)`: Store persistent memory
- `recall(key: string)`: Retrieve persistent memory
- `forget(key: string)`: Delete persistent memory
- `saveConversation(id?: string)`: Save current conversation
- `loadConversation(id: string)`: Load a conversation
- `clearConversation()`: Clear current conversation
- `setSystemPrompt(prompt: string)`: Set system prompt
- `getStats()`: Get agent statistics

### Memory Class

#### Methods
- `addMessage(message: ChatMessage)`: Add message to ephemeral history
- `getMessages()`: Get all ephemeral messages
- `getConversationContext()`: Get formatted conversation context
- `setEphemeral(key: string, value: any)`: Set ephemeral data
- `getEphemeral(key: string)`: Get ephemeral data
- `remember(key: string, value: any)`: Store persistent data
- `recall(key: string)`: Retrieve persistent data
- `forget(key: string)`: Delete persistent data

### Chat Class

#### Methods
- `ask(question: string, systemPrompt?: string)`: Simple question
- `chatCompletion(messages: ChatMessage[])`: Full chat completion
- `streamChatCompletion(messages: ChatMessage[], onChunk: (chunk: string) => void)`: Streaming completion
- `getServiceInfo()`: Get 0G Compute service metadata
- `setTemperature(temperature: number)`: Update temperature
- `setMaxTokens(maxTokens: number)`: Update max tokens

## Configuration

### AgentConfig

```typescript
interface AgentConfig {
  name: string;                    // Agent name
  providerAddress: string;         // 0G Compute provider address
  memoryBucket: string;           // 0G Storage bucket for persistent memory
  maxEphemeralMessages?: number;   // Max messages in ephemeral memory (default: 50)
  temperature?: number;            // LLM temperature (default: 0.7)
  maxTokens?: number;             // Max tokens per response (default: 1000)
}
```

## Requirements

- Node.js 16+
- Access to 0G Network (testnet or mainnet)
- Private key for wallet interactions with 0G Network
- 0G Storage access for persistent memory
- 0G Compute provider address for LLM inference

## 0G Network Configuration

This SDK is specifically designed for the 0G Network ecosystem:

- **0G Chain**: EVM-compatible blockchain for transactions
- **0G Storage**: Decentralized storage network for persistent memory
- **0G Compute**: Decentralized compute network for AI inference

### Default Endpoints

- **0G Chain RPC**: `https://evmrpc-testnet.0g.ai`
- **0G Storage Indexer**: `https://indexer-storage-testnet-turbo.0g.ai`
- **0G Storage KV**: `http://3.101.147.150:6789`
- **0G Compute**: `https://compute-testnet.0g.ai`

## License

MIT
