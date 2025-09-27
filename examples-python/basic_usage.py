"""
Basic usage example for the Nebula SDK Python library.

This example demonstrates:
- Creating an agent
- Basic conversation
- Memory usage
- System prompts
"""

import asyncio
import os
from nebula_sdk import create_agent

async def main():
    """Main function demonstrating basic SDK usage"""
    
    # Configuration for the agent
    config = {
        'name': 'Basic Assistant',
        'provider_address': '0xf07240Efa67755B5311bc75784a061eDB47165Dd',  # llama-3.3-70b-instruct
        'memory_bucket': 'basic-usage-demo',
        'private_key': os.environ.get('ZG_PRIVATE_KEY', 'your-private-key-here'),
        'temperature': 0.7,
        'max_tokens': 1000
    }
    
    try:
        print("🚀 Creating agent...")
        agent = await create_agent(config)
        await agent.init()
        print("✅ Agent initialized successfully!")
        
        # Set a system prompt
        agent.set_system_prompt("""
        You are a helpful AI assistant. Be concise but informative in your responses.
        When asked about programming, focus on practical examples and best practices.
        """)
        
        print("\n💾 Saving system prompt...")
        await agent.save_system_prompt()
        
        # Store some user information
        print("\n📝 Storing user preferences...")
        await agent.remember('user_info', {
            'name': 'Alice',
            'programming_languages': ['Python', 'JavaScript'],
            'experience_level': 'intermediate',
            'interests': ['AI', 'web development', 'data science']
        })
        
        # Basic conversation
        print("\n💬 Starting conversation...")
        
        questions = [
            "Hello! What can you help me with?",
            "I'm interested in learning more about AI. Can you give me an overview?",
            "What programming languages do I know?",  # Should reference stored memory
            "Can you recommend some Python libraries for AI development?"
        ]
        
        for i, question in enumerate(questions, 1):
            print(f"\n👤 User: {question}")
            
            # Use chat_with_context to maintain conversation history
            response = await agent.chat_with_context(question)
            print(f"🤖 Agent: {response}")
            
            # Add a small delay between messages
            await asyncio.sleep(1)
        
        # Demonstrate memory retrieval
        print("\n🧠 Retrieving stored information...")
        user_info = await agent.recall('user_info')
        print(f"Stored user info: {user_info}")
        
        # Show conversation statistics
        print("\n📊 Agent Statistics:")
        stats = agent.get_stats()
        print(f"- Agent name: {stats['name']}")
        print(f"- Messages in conversation: {stats['memory']['ephemeral_messages']}")
        print(f"- Temperature: {stats['chat']['temperature']}")
        print(f"- Max tokens: {stats['chat']['max_tokens']}")
        
        # Save the conversation
        print("\n💾 Saving conversation...")
        conversation_id = await agent.save_conversation('basic_demo_session')
        print(f"Conversation saved with ID: {conversation_id}")
        
        # Demonstrate loading a conversation
        print("\n🔄 Clearing and reloading conversation...")
        agent.clear_conversation()
        await agent.load_conversation('basic_demo_session')
        
        # Continue the conversation
        final_response = await agent.chat_with_context(
            "Based on our previous conversation, what would be a good next step for my AI learning journey?"
        )
        print(f"\n🤖 Agent (after reload): {final_response}")
        
        print("\n✅ Basic usage demo completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("Make sure you have set the ZG_PRIVATE_KEY environment variable.")

if __name__ == "__main__":
    # Set up environment variables if needed
    if not os.environ.get('ZG_PRIVATE_KEY'):
        print("⚠️  Warning: ZG_PRIVATE_KEY environment variable not set.")
        print("Please set it with your actual private key:")
        print("export ZG_PRIVATE_KEY='your-private-key-here'")
        print("\nUsing placeholder for demo purposes...")
    
    # Run the async main function
    asyncio.run(main())
