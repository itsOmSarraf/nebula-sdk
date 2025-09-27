import { createAgent } from '../src/index';

async function streamingExample() {
  try {
    const agent = await createAgent({
      name: "StreamingAgent",
      providerAddress: "0xf07240Efa67755B5311bc75784a061eDB47165Dd",
      memoryBucket: "streaming-agent-memory",
      privateKey: process.env.PRIVATE_KEY || "0x1234567890123456789012345678901234567890123456789012345678901234",
      temperature: 0.8
    });

    // Set a system prompt
    agent.setSystemPrompt("You are a creative storyteller. Tell engaging stories with vivid details.");
    await agent.saveSystemPrompt();

    console.log("Starting streaming chat example...\n");

    // Streaming chat with real-time output
    console.log("User: Tell me a short story about a robot learning to paint");
    console.log("Agent: ");

    const fullResponse = await agent.streamChat(
      "Tell me a short story about a robot learning to paint",
      (chunk) => {
        // This callback is called for each chunk of the response
        process.stdout.write(chunk);
      }
    );

    console.log("\n\n--- Full Response ---");
    console.log(fullResponse);

    // Follow-up question with context
    console.log("\n\nUser: What was the robot's name in that story?");
    console.log("Agent: ");

    await agent.streamChat(
      "What was the robot's name in that story?",
      (chunk) => {
        process.stdout.write(chunk);
      }
    );

    console.log("\n\n--- Conversation Stats ---");
    console.log(agent.getStats());

  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the example
if (require.main === module) {
  streamingExample();
}
