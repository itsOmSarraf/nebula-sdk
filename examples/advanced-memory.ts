import { Agent, createZGComputeNetworkBroker, ZGStorageClientImpl } from '../src/index';
import { ethers } from 'ethers';

async function advancedMemoryExample() {
  try {
    // Create agent manually for more control
    const privateKey = process.env.PRIVATE_KEY || "0x1234567890123456789012345678901234567890123456789012345678901234";
    const rpcUrl = "https://evmrpc-testnet.0g.ai";
    const indexerRpc = "https://indexer-storage-testnet-turbo.0g.ai";
    const kvRpc = "http://3.101.147.150:6789";
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);
    
    const storageClient = new ZGStorageClientImpl(
      indexerRpc,
      kvRpc,
      rpcUrl,
      signer,
      "advanced-memory-demo"
    );
    
    const broker = createZGComputeNetworkBroker(rpcUrl);
    
    const agent = new Agent({
      name: "MemoryAgent",
      providerAddress: "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
      memoryBucket: "advanced-memory-demo",
      maxEphemeralMessages: 20, // Keep only last 20 messages in memory
      temperature: 0.7,
      maxTokens: 500
    }, broker, storageClient);

    await agent.init();

    console.log("Advanced Memory Management Example\n");

    // Store various types of data
    console.log("--- Storing Complex Data ---");
    
    await agent.remember("userProfile", {
      name: "Om Sarraf",
      role: "Developer",
      preferences: {
        programmingLanguages: ["TypeScript", "Python", "Solidity"],
        interests: ["AI", "Blockchain", "DeFi"],
        workingHours: "9 AM - 6 PM PST"
      },
      projects: [
        { name: "0G AI SDK", status: "in-progress" },
        { name: "DeFi Dashboard", status: "completed" }
      ]
    });

    await agent.remember("apiKeys", {
      openai: "sk-...",
      anthropic: "ant-...",
      encrypted: true
    });

    await agent.remember("conversationSettings", {
      defaultTemperature: 0.7,
      maxContextLength: 4000,
      preferredModel: "llama-3.3-70b-instruct"
    });

    // Retrieve and use stored data
    console.log("--- Retrieving Stored Data ---");
    
    const userProfile = await agent.recall("userProfile");
    console.log("User Profile:", JSON.stringify(userProfile, null, 2));

    const settings = await agent.recall("conversationSettings");
    if (settings) {
      agent.setTemperature(settings.defaultTemperature);
      console.log("Applied saved temperature:", settings.defaultTemperature);
    }

    // Demonstrate ephemeral vs persistent memory
    console.log("\n--- Ephemeral vs Persistent Memory ---");
    
    // Ephemeral data (lost when agent is destroyed)
    agent.memory.setEphemeral("currentSession", {
      startTime: new Date(),
      messageCount: 0,
      tempData: "This will be lost when agent restarts"
    });

    // Simulate some conversation
    await agent.chatWithContext("Hi! Can you tell me about my programming preferences?");
    
    // Update ephemeral session data
    const session = agent.memory.getEphemeral("currentSession");
    session.messageCount = agent.memory.getMessages().length;
    agent.memory.setEphemeral("currentSession", session);

    console.log("Current session data:", agent.memory.getEphemeral("currentSession"));

    // Demonstrate conversation persistence
    console.log("\n--- Conversation Persistence ---");
    
    await agent.chatWithContext("What projects am I working on?");
    await agent.chatWithContext("Can you suggest a good time for a meeting?");

    // Save multiple conversations with different IDs
    const conv1 = await agent.saveConversation("work_discussion");
    console.log("Saved work discussion:", conv1);

    // Start a new conversation
    agent.clearConversation();
    await agent.chatWithContext("Let's talk about something completely different - what's your favorite color?");
    
    const conv2 = await agent.saveConversation("casual_chat");
    console.log("Saved casual chat:", conv2);

    // Load back the work conversation
    await agent.loadConversation("work_discussion");
    console.log("Loaded work discussion - messages:", agent.memory.getMessages().length);

    // Memory statistics
    console.log("\n--- Memory Statistics ---");
    console.log("Agent stats:", agent.getStats());

    // Cleanup example
    console.log("\n--- Memory Cleanup ---");
    await agent.forget("apiKeys");
    console.log("Deleted API keys from persistent memory");

    const deletedKeys = await agent.recall("apiKeys");
    console.log("API keys after deletion:", deletedKeys); // Should be null

  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the example
if (require.main === module) {
  advancedMemoryExample();
}
