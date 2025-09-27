"""
Streaming chat example for the 0G AI SDK Python library.

This example demonstrates:
- Real-time streaming responses
- Different streaming patterns
- Progress tracking
- Error handling during streaming
"""

import asyncio
import os
import time
from zg_ai_sdk import create_agent, SDKError

class StreamingDemo:
    def __init__(self):
        self.agent = None
        self.word_count = 0
        self.char_count = 0
        self.start_time = None
    
    async def initialize_agent(self):
        """Initialize the streaming agent"""
        config = {
            'name': 'Streaming Assistant',
            'provider_address': '0xf07240Efa67755B5311bc75784a061eDB47165Dd',
            'memory_bucket': 'streaming-demo',
            'private_key': os.environ.get('ZG_PRIVATE_KEY', 'your-private-key-here'),
            'temperature': 0.8,  # More creative for storytelling
            'max_tokens': 2000   # Allow longer responses
        }
        
        self.agent = await create_agent(config)
        await self.agent.init()
        
        # Set up for creative content generation
        self.agent.set_system_prompt("""
        You are a creative storyteller and content generator. When asked to create content:
        1. Be engaging and descriptive
        2. Use vivid imagery and details
        3. Maintain a consistent narrative flow
        4. Adapt your style to the requested content type
        """)
    
    def simple_print_handler(self, chunk: str):
        """Simple chunk handler that just prints"""
        print(chunk, end='', flush=True)
    
    def progress_tracking_handler(self, chunk: str):
        """Chunk handler with progress tracking"""
        self.char_count += len(chunk)
        self.word_count += len(chunk.split())
        
        print(chunk, end='', flush=True)
        
        # Show progress every 100 characters
        if self.char_count % 100 == 0:
            elapsed = time.time() - self.start_time
            chars_per_sec = self.char_count / elapsed if elapsed > 0 else 0
            print(f"\n[📊 Progress: {self.char_count} chars, ~{self.word_count} words, {chars_per_sec:.1f} chars/sec]", end='')
    
    def collecting_handler(self, chunks_list):
        """Returns a handler that collects chunks in a list"""
        def handler(chunk: str):
            chunks_list.append(chunk)
            print(chunk, end='', flush=True)
        return handler
    
    async def demo_simple_streaming(self):
        """Demonstrate simple streaming"""
        print("🎬 Demo 1: Simple Streaming")
        print("=" * 50)
        
        prompt = "Write a short story about a robot learning to paint"
        
        print(f"👤 User: {prompt}")
        print("🤖 Agent: ", end='')
        
        response = await self.agent.stream_chat(prompt, self.simple_print_handler)
        
        print(f"\n\n📝 Complete response length: {len(response)} characters")
        print("-" * 50)
    
    async def demo_progress_tracking(self):
        """Demonstrate streaming with progress tracking"""
        print("\n🎬 Demo 2: Streaming with Progress Tracking")
        print("=" * 50)
        
        # Reset counters
        self.word_count = 0
        self.char_count = 0
        self.start_time = time.time()
        
        prompt = "Explain the history of artificial intelligence in detail, covering major milestones and breakthroughs"
        
        print(f"👤 User: {prompt}")
        print("🤖 Agent: ", end='')
        
        response = await self.agent.stream_chat(prompt, self.progress_tracking_handler)
        
        elapsed = time.time() - self.start_time
        print(f"\n\n📊 Final Stats:")
        print(f"- Characters: {self.char_count}")
        print(f"- Words: ~{self.word_count}")
        print(f"- Time: {elapsed:.2f} seconds")
        print(f"- Speed: {self.char_count/elapsed:.1f} chars/sec")
        print("-" * 50)
    
    async def demo_chunk_collection(self):
        """Demonstrate collecting chunks for analysis"""
        print("\n🎬 Demo 3: Chunk Collection and Analysis")
        print("=" * 50)
        
        chunks = []
        prompt = "Write a poem about the beauty of mathematics"
        
        print(f"👤 User: {prompt}")
        print("🤖 Agent: ", end='')
        
        response = await self.agent.stream_chat(
            prompt, 
            self.collecting_handler(chunks)
        )
        
        print(f"\n\n🔍 Chunk Analysis:")
        print(f"- Total chunks received: {len(chunks)}")
        print(f"- Average chunk size: {len(response)/len(chunks):.1f} chars")
        print(f"- Smallest chunk: {min(len(chunk) for chunk in chunks)} chars")
        print(f"- Largest chunk: {max(len(chunk) for chunk in chunks)} chars")
        
        # Show first few chunks
        print(f"\n📋 First 3 chunks:")
        for i, chunk in enumerate(chunks[:3]):
            print(f"  Chunk {i+1}: '{chunk}' ({len(chunk)} chars)")
        
        print("-" * 50)
    
    async def demo_error_handling(self):
        """Demonstrate error handling during streaming"""
        print("\n🎬 Demo 4: Error Handling")
        print("=" * 50)
        
        def error_prone_handler(chunk: str):
            """Handler that might encounter errors"""
            try:
                # Simulate occasional processing errors
                if "error" in chunk.lower():
                    raise ValueError("Simulated processing error")
                
                print(chunk, end='', flush=True)
            except Exception as e:
                print(f"\n⚠️ Chunk processing error: {e}")
                print("Continuing with next chunk...")
        
        prompt = "Tell me about error handling in software development"
        
        print(f"👤 User: {prompt}")
        print("🤖 Agent: ", end='')
        
        try:
            response = await self.agent.stream_chat(prompt, error_prone_handler)
            print(f"\n\n✅ Streaming completed despite chunk processing issues")
        except SDKError as e:
            print(f"\n❌ SDK Error during streaming: {e.message}")
        except Exception as e:
            print(f"\n❌ Unexpected error: {e}")
        
        print("-" * 50)
    
    async def demo_conversation_streaming(self):
        """Demonstrate streaming in a conversation context"""
        print("\n🎬 Demo 5: Conversational Streaming")
        print("=" * 50)
        
        conversation_topics = [
            "What are the benefits of renewable energy?",
            "Can you elaborate on solar power specifically?",
            "What about the challenges and limitations?",
            "How do you see the future of renewable energy?"
        ]
        
        for i, topic in enumerate(conversation_topics, 1):
            print(f"\n💬 Turn {i}")
            print(f"👤 User: {topic}")
            print("🤖 Agent: ", end='')
            
            response = await self.agent.stream_chat(topic, self.simple_print_handler)
            print()  # New line after each response
            
            # Small delay between conversation turns
            await asyncio.sleep(1)
        
        print("\n✅ Conversation streaming demo completed")
        print("-" * 50)

async def main():
    """Main function to run all streaming demos"""
    
    if not os.environ.get('ZG_PRIVATE_KEY'):
        print("⚠️  Warning: ZG_PRIVATE_KEY environment variable not set.")
        print("Please set it with your actual private key:")
        print("export ZG_PRIVATE_KEY='your-private-key-here'")
        print("\nUsing placeholder for demo purposes...")
    
    demo = StreamingDemo()
    
    try:
        print("🚀 Initializing streaming agent...")
        await demo.initialize_agent()
        print("✅ Agent ready for streaming demos!\n")
        
        # Run all demos
        await demo.demo_simple_streaming()
        await demo.demo_progress_tracking()
        await demo.demo_chunk_collection()
        await demo.demo_error_handling()
        await demo.demo_conversation_streaming()
        
        print("\n🎉 All streaming demos completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
