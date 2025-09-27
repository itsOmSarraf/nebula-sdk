import { createAgent } from '../src/index';

async function basicExample() {
  try {
    // Create agent with simple configuration
    const agent = await createAgent({
      name: "BasicAgent",
      providerAddress: "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
      memoryBucket: "basic-agent-memory",
      privateKey: process.env.PRIVATE_KEY || "0x1234567890123456789012345678901234567890123456789012345678901234" // Replace with your private key
    });

    console.log("Agent initialized successfully!");
    console.log("Agent stats:", agent.getStats());

    // Simple chat
    console.log("\n--- Simple Chat ---");
    const response1 = await agent.ask("Hello! What's your name?");
    console.log("Agent:", response1);

    // Chat with context (remembers previous messages)
    console.log("\n--- Chat with Context ---");
    const response2 = await agent.chatWithContext("What did I just ask you?");
    console.log("Agent:", response2);

    // Store and retrieve persistent memory
    console.log("\n--- Persistent Memory ---");
    await agent.remember("userInfo", {
      name: "Om",
      interests: ["AI", "blockchain", "TypeScript"]
    });

    const userInfo = await agent.recall("userInfo");
    console.log("Recalled user info:", userInfo);

    // Use ephemeral memory
    console.log("\n--- Ephemeral Memory ---");
    agent.memory.setEphemeral("sessionData", { startTime: new Date() });
    const sessionData = agent.memory.getEphemeral("sessionData");
    console.log("Session data:", sessionData);

    // Save conversation
    console.log("\n--- Conversation Management ---");
    const conversationId = await agent.saveConversation();
    console.log("Saved conversation with ID:", conversationId);

    // Clear and load conversation
    agent.clearConversation();
    console.log("Conversation cleared");
    
    await agent.loadConversation(conversationId);
    console.log("Conversation loaded back");
    console.log("Messages in memory:", agent.memory.getMessages().length);

  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the example
if (require.main === module) {
  basicExample();
}
