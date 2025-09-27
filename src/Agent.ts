import { Memory } from "./Memory";
import { Chat } from "./Chat";
import { AgentConfig, ChatMessage, ZGComputeBroker, ZGStorageClient } from "./types";

export class Agent {
  public readonly name: string;
  public readonly memory: Memory;
  public readonly chat: Chat;
  private systemPrompt?: string;

  constructor(config: AgentConfig, broker: ZGComputeBroker, storageClient: ZGStorageClient) {
    this.name = config.name;
    this.memory = new Memory(storageClient, config.memoryBucket, config.maxEphemeralMessages);
    this.chat = new Chat(
      broker, 
      config.providerAddress, 
      config.temperature, 
      config.maxTokens
    );
  }

  async init(): Promise<void> {
    // Perform any initialization tasks
    try {
      // Test connection to 0G Compute
      await this.chat.getServiceInfo();
      
      // Load any persistent agent configuration
      const savedConfig = await this.memory.recall('agent_config');
      if (savedConfig) {
        this.systemPrompt = savedConfig.systemPrompt;
      }
    } catch (error) {
      throw new Error(`Agent initialization failed: ${error}`);
    }
  }

  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  async saveSystemPrompt(): Promise<void> {
    if (this.systemPrompt) {
      await this.memory.remember('agent_config', { 
        systemPrompt: this.systemPrompt 
      });
    }
  }

  async ask(input: string): Promise<string> {
    // Add user message to memory
    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    this.memory.addMessage(userMessage);

    try {
      // Get response from chat
      const response = await this.chat.ask(input, this.systemPrompt);

      // Add assistant response to memory
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      this.memory.addMessage(assistantMessage);

      return response;
    } catch (error) {
      throw new Error(`Chat failed: ${error}`);
    }
  }

  async chatWithContext(input: string): Promise<string> {
    // Build conversation context from memory
    const messages: ChatMessage[] = [];

    // Add system prompt if available
    if (this.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.systemPrompt
      });
    }

    // Add conversation history
    messages.push(...this.memory.getMessages());

    // Add current user input
    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    messages.push(userMessage);

    try {
      // Get response with full context
      const response = await this.chat.chatCompletion(messages);
      const assistantContent = response.choices[0]?.message?.content || '';

      // Add messages to memory
      this.memory.addMessage(userMessage);
      this.memory.addMessage({
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      });

      return assistantContent;
    } catch (error) {
      throw new Error(`Context chat failed: ${error}`);
    }
  }

  async streamChat(
    input: string, 
    onChunk: (chunk: string) => void
  ): Promise<string> {
    // Build conversation context
    const messages: ChatMessage[] = [];

    if (this.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.systemPrompt
      });
    }

    messages.push(...this.memory.getMessages());

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    messages.push(userMessage);

    try {
      const response = await this.chat.streamChatCompletion(messages, onChunk);

      // Add messages to memory
      this.memory.addMessage(userMessage);
      this.memory.addMessage({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });

      return response;
    } catch (error) {
      throw new Error(`Stream chat failed: ${error}`);
    }
  }

  // Memory convenience methods
  async remember(key: string, value: any): Promise<void> {
    return this.memory.remember(key, value);
  }

  async recall(key: string): Promise<any> {
    return this.memory.recall(key);
  }

  async forget(key: string): Promise<void> {
    return this.memory.forget(key);
  }

  // Conversation management
  async saveConversation(conversationId?: string): Promise<string> {
    const id = conversationId || `conv_${Date.now()}`;
    await this.memory.rememberConversation(id);
    return id;
  }

  async loadConversation(conversationId: string): Promise<void> {
    const messages = await this.memory.recallConversation(conversationId);
    this.memory.clearEphemeralMessages();
    messages.forEach(msg => this.memory.addMessage(msg));
  }

  clearConversation(): void {
    this.memory.clearEphemeralMessages();
  }

  // Agent introspection
  getStats(): {
    name: string;
    memory: ReturnType<Memory['getStats']>;
    chat: ReturnType<Chat['getConfig']>;
    systemPrompt?: string;
  } {
    return {
      name: this.name,
      memory: this.memory.getStats(),
      chat: this.chat.getConfig(),
      systemPrompt: this.systemPrompt
    };
  }

  async getServiceInfo() {
    return this.chat.getServiceInfo();
  }

  // Configuration updates
  setTemperature(temperature: number): void {
    this.chat.setTemperature(temperature);
  }

  setMaxTokens(maxTokens: number): void {
    this.chat.setMaxTokens(maxTokens);
  }
}
