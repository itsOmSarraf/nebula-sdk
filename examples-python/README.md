# 0G AI SDK Python Examples

This directory contains comprehensive examples demonstrating the capabilities of the 0G AI SDK Python library.

## Prerequisites

1. **Install the SDK**:
   ```bash
   pip install zg-ai-sdk
   ```

2. **Set up environment variables**:
   ```bash
   export ZG_PRIVATE_KEY="your-private-key-here"
   ```

3. **Optional environment variables**:
   ```bash
   export ZG_RPC_URL="https://evmrpc-testnet.0g.ai"
   export ZG_INDEXER_RPC="https://indexer-storage-testnet-turbo.0g.ai"
   export ZG_KV_RPC="http://3.101.147.150:6789"
   ```

## Examples Overview

### 1. Basic Usage (`basic_usage.py`)

**What it demonstrates:**
- Creating and initializing an agent
- Setting system prompts
- Basic conversation flow
- Memory storage and retrieval
- Conversation management

**Key features:**
- Simple agent setup
- User preference storage
- Multi-turn conversation
- Conversation persistence

**Run it:**
```bash
python basic_usage.py
```

### 2. Streaming Chat (`streaming_chat.py`)

**What it demonstrates:**
- Real-time streaming responses
- Different chunk handling patterns
- Progress tracking during streaming
- Error handling in streaming contexts
- Conversational streaming

**Key features:**
- Multiple streaming handlers
- Performance metrics
- Chunk analysis
- Error recovery

**Run it:**
```bash
python streaming_chat.py
```

### 3. Advanced Memory (`advanced_memory.py`)

**What it demonstrates:**
- Complex data structure storage
- Memory search functionality
- Data versioning
- Memory analytics
- Conversation memory management

**Key features:**
- Structured data storage
- Search algorithms
- Version history tracking
- Usage analytics

**Run it:**
```bash
python advanced_memory.py
```

## Available Models

The examples use these 0G network models:

| Model | Provider Address | Best For |
|-------|------------------|----------|
| `llama-3.3-70b-instruct` | `0xf07240Efa67755B5311bc75784a061eDB47165Dd` | General conversations, creative tasks |
| `deepseek-r1-70b` | `0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3` | Complex reasoning, analysis |

## Example Patterns

### Agent Configuration

```python
config = {
    'name': 'My Agent',
    'provider_address': '0xf07240Efa67755B5311bc75784a061eDB47165Dd',
    'memory_bucket': 'my-memory-bucket',
    'private_key': os.environ['ZG_PRIVATE_KEY'],
    'temperature': 0.7,
    'max_tokens': 1500
}

agent = await create_agent(config)
await agent.init()
```

### Basic Chat

```python
# Simple question
response = await agent.ask('What is machine learning?')

# Conversation with context
response = await agent.chat_with_context('Tell me more about neural networks')
```

### Streaming

```python
def handle_chunk(chunk: str):
    print(chunk, end='', flush=True)

response = await agent.stream_chat('Tell me a story', handle_chunk)
```

### Memory Operations

```python
# Store data
await agent.remember('user_data', {'name': 'Alice', 'role': 'developer'})

# Retrieve data
user_data = await agent.recall('user_data')

# Remove data
await agent.forget('temporary_data')
```

### Conversation Management

```python
# Save conversation
conv_id = await agent.save_conversation('session_1')

# Clear current conversation
agent.clear_conversation()

# Load saved conversation
await agent.load_conversation('session_1')
```

## Error Handling

All examples include proper error handling:

```python
from zg_ai_sdk import SDKError

try:
    response = await agent.ask('Hello')
except SDKError as e:
    print(f"SDK Error: {e.message} (Code: {e.code})")
except Exception as e:
    print(f"Unexpected error: {e}")
```

## Performance Tips

1. **Reuse agents**: Create agents once and reuse them for multiple operations
2. **Batch operations**: Group related memory operations together
3. **Stream long responses**: Use streaming for better user experience
4. **Monitor memory usage**: Check agent stats periodically
5. **Handle errors gracefully**: Implement retry logic for network operations

## Customization

### Custom System Prompts

```python
agent.set_system_prompt('''
You are a specialized assistant for software development.
Focus on:
1. Practical code examples
2. Best practices
3. Security considerations
4. Performance optimization
''')
```

### Custom Memory Buckets

Use different memory buckets for different use cases:

```python
# User-specific data
user_agent = await create_agent({..., 'memory_bucket': 'user_123_data'})

# Project-specific data  
project_agent = await create_agent({..., 'memory_bucket': 'project_abc_data'})

# Session-specific data
session_agent = await create_agent({..., 'memory_bucket': 'session_xyz_data'})
```

### Temperature and Token Settings

```python
# Creative tasks
agent.set_temperature(0.9)
agent.set_max_tokens(2000)

# Analytical tasks
agent.set_temperature(0.3)
agent.set_max_tokens(1000)
```

## Troubleshooting

### Common Issues

1. **Private Key Error**: Make sure `ZG_PRIVATE_KEY` environment variable is set
2. **Network Timeout**: Check your internet connection and RPC endpoints
3. **Memory Errors**: Verify your memory bucket name is unique
4. **Rate Limiting**: Add delays between requests if needed

### Debug Mode

Enable verbose logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Health Checks

```python
# Test agent connectivity
service_info = await agent.get_service_info()
print(f"Connected to: {service_info.model}")

# Check memory stats
stats = agent.get_stats()
print(f"Memory usage: {stats}")
```

## Next Steps

1. **Explore the API Reference**: [Python API Documentation](/api-reference-python/introduction)
2. **Build Custom Tools**: [Agent Tools Guide](/api-reference-python/agent/tools)
3. **Integration Patterns**: [Agent Execution Guide](/api-reference-python/agent/execute)
4. **Join the Community**: [Discord](https://discord.gg/0g)

## Support

- **Documentation**: [https://docs.0g.ai](https://docs.0g.ai)
- **GitHub Issues**: [https://github.com/0glabs/0g-ai-sdk-python/issues](https://github.com/0glabs/0g-ai-sdk-python/issues)
- **Discord**: [https://discord.gg/0g](https://discord.gg/0g)
- **Email**: support@0g.ai
