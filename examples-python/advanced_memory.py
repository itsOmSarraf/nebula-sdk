"""
Advanced memory usage example for the 0G AI SDK Python library.

This example demonstrates:
- Persistent memory storage and retrieval
- Complex data structures
- Memory search and organization
- Conversation management
- Memory analytics
"""

import asyncio
import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
from zg_ai_sdk import create_agent

class AdvancedMemoryDemo:
    def __init__(self):
        self.agent = None
    
    async def initialize_agent(self):
        """Initialize agent with memory capabilities"""
        config = {
            'name': 'Memory Expert',
            'provider_address': '0xf07240Efa67755B5311bc75784a061eDB47165Dd',
            'memory_bucket': 'advanced-memory-demo',
            'private_key': os.environ.get('ZG_PRIVATE_KEY', 'your-private-key-here'),
            'max_ephemeral_messages': 100,  # Keep more conversation history
            'temperature': 0.7,
            'max_tokens': 1500
        }
        
        self.agent = await create_agent(config)
        await self.agent.init()
        
        self.agent.set_system_prompt("""
        You are a memory management expert. You help users organize and retrieve information.
        When discussing stored data, be specific about what was found and provide context.
        Always reference relevant stored information when answering questions.
        """)
    
    async def demo_structured_data_storage(self):
        """Demonstrate storing complex structured data"""
        print("🗄️ Demo 1: Structured Data Storage")
        print("=" * 50)
        
        # Store user profile with nested data
        user_profile = {
            'personal_info': {
                'name': 'Dr. Sarah Chen',
                'email': 'sarah.chen@university.edu',
                'title': 'Research Scientist',
                'department': 'Computer Science'
            },
            'research_interests': [
                'Machine Learning',
                'Natural Language Processing',
                'Computer Vision',
                'Robotics'
            ],
            'projects': {
                'current': [
                    {
                        'name': 'Autonomous Navigation',
                        'status': 'active',
                        'start_date': '2024-01-15',
                        'team_size': 5,
                        'budget': 250000
                    },
                    {
                        'name': 'Language Model Optimization',
                        'status': 'active',
                        'start_date': '2024-03-01',
                        'team_size': 3,
                        'budget': 150000
                    }
                ],
                'completed': [
                    {
                        'name': 'Image Classification System',
                        'status': 'completed',
                        'completion_date': '2023-12-20',
                        'outcome': 'Published in CVPR 2024'
                    }
                ]
            },
            'publications': [
                {
                    'title': 'Advanced Neural Networks for Image Recognition',
                    'venue': 'CVPR 2024',
                    'year': 2024,
                    'citations': 15
                },
                {
                    'title': 'Efficient Training Methods for Large Language Models',
                    'venue': 'NeurIPS 2023',
                    'year': 2023,
                    'citations': 42
                }
            ],
            'preferences': {
                'programming_languages': ['Python', 'C++', 'CUDA'],
                'frameworks': ['PyTorch', 'TensorFlow', 'OpenCV'],
                'notification_settings': {
                    'email_updates': True,
                    'project_reminders': True,
                    'deadline_alerts': True
                }
            },
            'metadata': {
                'created_at': datetime.now().isoformat(),
                'last_updated': datetime.now().isoformat(),
                'version': '1.0'
            }
        }
        
        print("📝 Storing comprehensive user profile...")
        await self.agent.remember('user_profile', user_profile)
        
        # Store additional related data
        research_notes = {
            'neural_networks': {
                'key_concepts': [
                    'Backpropagation',
                    'Gradient Descent',
                    'Regularization',
                    'Batch Normalization'
                ],
                'recent_papers': [
                    'Attention Is All You Need',
                    'BERT: Pre-training of Deep Bidirectional Transformers',
                    'GPT-3: Language Models are Few-Shot Learners'
                ],
                'notes': 'Focus on transformer architectures for next project'
            },
            'computer_vision': {
                'datasets': ['ImageNet', 'COCO', 'CIFAR-10', 'MNIST'],
                'techniques': ['CNN', 'ResNet', 'Vision Transformer', 'YOLO'],
                'current_focus': 'Real-time object detection for robotics'
            }
        }
        
        await self.agent.remember('research_notes', research_notes)
        
        # Store project-specific data
        project_data = {
            'autonomous_navigation': {
                'milestones': [
                    {'name': 'Environment Mapping', 'status': 'completed', 'date': '2024-02-15'},
                    {'name': 'Path Planning Algorithm', 'status': 'in_progress', 'date': '2024-04-01'},
                    {'name': 'Obstacle Avoidance', 'status': 'pending', 'date': '2024-05-15'},
                    {'name': 'Integration Testing', 'status': 'pending', 'date': '2024-06-30'}
                ],
                'team_members': [
                    {'name': 'Alex Rodriguez', 'role': 'Software Engineer'},
                    {'name': 'Maria Kim', 'role': 'Robotics Engineer'},
                    {'name': 'James Wilson', 'role': 'Data Scientist'},
                    {'name': 'Lisa Zhang', 'role': 'Research Assistant'}
                ],
                'technical_specs': {
                    'sensors': ['LiDAR', 'Camera', 'IMU', 'GPS'],
                    'processing_unit': 'NVIDIA Jetson AGX Xavier',
                    'software_stack': ['ROS2', 'OpenCV', 'PCL', 'SLAM']
                }
            }
        }
        
        await self.agent.remember('project_autonomous_navigation', project_data)
        
        print("✅ Stored complex structured data successfully")
        print("-" * 50)
    
    async def demo_memory_retrieval_and_analysis(self):
        """Demonstrate retrieving and analyzing stored data"""
        print("\n🔍 Demo 2: Memory Retrieval and Analysis")
        print("=" * 50)
        
        # Retrieve and analyze user profile
        print("📊 Analyzing stored user profile...")
        profile = await self.agent.recall('user_profile')
        
        if profile:
            print(f"👤 User: {profile['personal_info']['name']}")
            print(f"🏢 Position: {profile['personal_info']['title']}")
            print(f"🔬 Research Areas: {', '.join(profile['research_interests'])}")
            print(f"📚 Publications: {len(profile['publications'])}")
            print(f"🚀 Active Projects: {len(profile['projects']['current'])}")
            
            # Calculate total budget
            total_budget = sum(project['budget'] for project in profile['projects']['current'])
            print(f"💰 Total Active Project Budget: ${total_budget:,}")
            
            # Analyze publication impact
            total_citations = sum(pub['citations'] for pub in profile['publications'])
            print(f"📈 Total Citations: {total_citations}")
        
        # Retrieve research notes
        print("\n📝 Analyzing research notes...")
        notes = await self.agent.recall('research_notes')
        
        if notes:
            for area, data in notes.items():
                print(f"🔬 {area.replace('_', ' ').title()}:")
                if 'key_concepts' in data:
                    print(f"  - Key Concepts: {len(data['key_concepts'])}")
                if 'datasets' in data:
                    print(f"  - Datasets: {len(data['datasets'])}")
                if 'current_focus' in data:
                    print(f"  - Focus: {data['current_focus']}")
        
        print("-" * 50)
    
    async def demo_memory_search(self):
        """Demonstrate searching through stored memory"""
        print("\n🔎 Demo 3: Memory Search Functionality")
        print("=" * 50)
        
        # Implement a simple search function
        async def search_memory(query_terms: List[str]) -> Dict[str, Any]:
            """Search through stored memory for relevant information"""
            results = {}
            
            # Define keys to search through
            search_keys = [
                'user_profile',
                'research_notes', 
                'project_autonomous_navigation'
            ]
            
            for key in search_keys:
                data = await self.agent.recall(key)
                if data:
                    # Convert data to searchable text
                    text_content = json.dumps(data, default=str).lower()
                    
                    # Check if any query terms match
                    matches = [term for term in query_terms if term.lower() in text_content]
                    
                    if matches:
                        results[key] = {
                            'data': data,
                            'matched_terms': matches,
                            'relevance_score': len(matches) / len(query_terms)
                        }
            
            return results
        
        # Search for machine learning related content
        print("🔍 Searching for 'machine learning' content...")
        ml_results = await search_memory(['machine', 'learning', 'neural', 'model'])
        
        for key, result in ml_results.items():
            print(f"\n📄 Found in {key}:")
            print(f"  - Matched terms: {result['matched_terms']}")
            print(f"  - Relevance: {result['relevance_score']:.2f}")
        
        # Search for project-related content
        print("\n🔍 Searching for 'robotics' content...")
        robotics_results = await search_memory(['robotics', 'navigation', 'autonomous', 'robot'])
        
        for key, result in robotics_results.items():
            print(f"\n📄 Found in {key}:")
            print(f"  - Matched terms: {result['matched_terms']}")
            print(f"  - Relevance: {result['relevance_score']:.2f}")
        
        print("-" * 50)
    
    async def demo_conversation_memory_management(self):
        """Demonstrate conversation memory management"""
        print("\n💬 Demo 4: Conversation Memory Management")
        print("=" * 50)
        
        # Have a conversation about stored data
        questions = [
            "What can you tell me about my research profile?",
            "What are my current active projects?",
            "What's the status of the autonomous navigation project?",
            "What programming languages and frameworks do I prefer?",
            "How many publications do I have and what's their impact?"
        ]
        
        for i, question in enumerate(questions, 1):
            print(f"\n💬 Question {i}: {question}")
            response = await self.agent.chat_with_context(question)
            print(f"🤖 Response: {response}")
        
        # Save this conversation
        conversation_id = await self.agent.save_conversation('research_profile_discussion')
        print(f"\n💾 Saved conversation as: {conversation_id}")
        
        # Demonstrate conversation loading
        print("\n🔄 Testing conversation persistence...")
        agent.clear_conversation()
        
        # Load the conversation back
        await self.agent.load_conversation('research_profile_discussion')
        
        # Continue the conversation
        follow_up = "Based on our discussion, what should be my next research priority?"
        print(f"\n💬 Follow-up: {follow_up}")
        response = await self.agent.chat_with_context(follow_up)
        print(f"🤖 Response: {response}")
        
        print("-" * 50)
    
    async def demo_memory_versioning(self):
        """Demonstrate versioning of stored data"""
        print("\n📋 Demo 5: Memory Versioning")
        print("=" * 50)
        
        # Create versioned data storage
        async def store_versioned_data(key: str, data: Any, version_note: str = ""):
            """Store data with version history"""
            # Get existing version history
            history_key = f"{key}_history"
            history = await self.agent.recall(history_key) or []
            
            # Create new version entry
            version_entry = {
                'version': len(history) + 1,
                'timestamp': datetime.now().isoformat(),
                'data': data,
                'note': version_note
            }
            
            # Update history
            history.append(version_entry)
            
            # Store current version and history
            await self.agent.remember(key, data)
            await self.agent.remember(history_key, history)
            
            return version_entry['version']
        
        # Store multiple versions of project status
        project_status_v1 = {
            'phase': 'planning',
            'completion': 10,
            'next_milestone': 'Environment Mapping',
            'issues': ['Budget approval pending']
        }
        
        v1 = await store_versioned_data(
            'project_status', 
            project_status_v1, 
            "Initial project planning phase"
        )
        print(f"📝 Stored version {v1}: Planning phase")
        
        # Simulate project progress
        await asyncio.sleep(1)
        
        project_status_v2 = {
            'phase': 'development',
            'completion': 35,
            'next_milestone': 'Path Planning Algorithm',
            'issues': ['Sensor calibration challenges']
        }
        
        v2 = await store_versioned_data(
            'project_status',
            project_status_v2,
            "Development phase started, environment mapping completed"
        )
        print(f"📝 Stored version {v2}: Development phase")
        
        # Simulate more progress
        await asyncio.sleep(1)
        
        project_status_v3 = {
            'phase': 'testing',
            'completion': 70,
            'next_milestone': 'Integration Testing',
            'issues': ['Performance optimization needed']
        }
        
        v3 = await store_versioned_data(
            'project_status',
            project_status_v3,
            "Testing phase, path planning algorithm implemented"
        )
        print(f"📝 Stored version {v3}: Testing phase")
        
        # Retrieve version history
        history = await self.agent.recall('project_status_history')
        print(f"\n📚 Version History:")
        for entry in history:
            print(f"  v{entry['version']} ({entry['timestamp'][:10]}): {entry['note']}")
            print(f"    Phase: {entry['data']['phase']}, Completion: {entry['data']['completion']}%")
        
        print("-" * 50)
    
    async def demo_memory_analytics(self):
        """Demonstrate memory usage analytics"""
        print("\n📊 Demo 6: Memory Analytics")
        print("=" * 50)
        
        # Get memory statistics
        stats = self.agent.memory.get_stats()
        print(f"📈 Memory Statistics:")
        print(f"  - Ephemeral messages: {stats['ephemeral_messages']}")
        print(f"  - Ephemeral data items: {stats['ephemeral_data']}")
        print(f"  - Max ephemeral messages: {stats['max_ephemeral_messages']}")
        
        # Analyze stored data
        stored_keys = [
            'user_profile',
            'research_notes',
            'project_autonomous_navigation',
            'project_status',
            'project_status_history'
        ]
        
        print(f"\n🗄️ Stored Data Analysis:")
        total_size = 0
        
        for key in stored_keys:
            data = await self.agent.recall(key)
            if data:
                data_str = json.dumps(data, default=str)
                size = len(data_str)
                total_size += size
                
                print(f"  - {key}: {size:,} characters")
                
                # Analyze data structure
                if isinstance(data, dict):
                    print(f"    └─ Dictionary with {len(data)} keys")
                elif isinstance(data, list):
                    print(f"    └─ List with {len(data)} items")
        
        print(f"\n📊 Total stored data: {total_size:,} characters")
        
        # Conversation analytics
        messages = self.agent.memory.get_messages()
        if messages:
            user_messages = [m for m in messages if m.role == 'user']
            assistant_messages = [m for m in messages if m.role == 'assistant']
            
            print(f"\n💬 Conversation Analytics:")
            print(f"  - Total messages: {len(messages)}")
            print(f"  - User messages: {len(user_messages)}")
            print(f"  - Assistant messages: {len(assistant_messages)}")
            
            if messages:
                avg_length = sum(len(m.content) for m in messages) / len(messages)
                print(f"  - Average message length: {avg_length:.1f} characters")
        
        print("-" * 50)

async def main():
    """Main function to run all memory demos"""
    
    if not os.environ.get('ZG_PRIVATE_KEY'):
        print("⚠️  Warning: ZG_PRIVATE_KEY environment variable not set.")
        print("Please set it with your actual private key:")
        print("export ZG_PRIVATE_KEY='your-private-key-here'")
        print("\nUsing placeholder for demo purposes...")
    
    demo = AdvancedMemoryDemo()
    
    try:
        print("🚀 Initializing advanced memory agent...")
        await demo.initialize_agent()
        print("✅ Agent ready for memory demos!\n")
        
        # Run all demos
        await demo.demo_structured_data_storage()
        await demo.demo_memory_retrieval_and_analysis()
        await demo.demo_memory_search()
        await demo.demo_conversation_memory_management()
        await demo.demo_memory_versioning()
        await demo.demo_memory_analytics()
        
        print("\n🎉 All advanced memory demos completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
