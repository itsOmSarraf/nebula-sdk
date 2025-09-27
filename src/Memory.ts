import { ZGStorageClient, MemoryItem, ChatMessage } from "./types";

export class Memory {
  private ephemeralMessages: ChatMessage[] = [];
  private ephemeralData: Map<string, any> = new Map();
  private storageClient: ZGStorageClient;
  private bucket: string;
  private maxEphemeralMessages: number;

  constructor(storageClient: ZGStorageClient, bucket: string, maxEphemeralMessages: number = 50) {
    this.storageClient = storageClient;
    this.bucket = bucket;
    this.maxEphemeralMessages = maxEphemeralMessages;
  }

  // Ephemeral memory for conversation context
  addMessage(message: ChatMessage): void {
    this.ephemeralMessages.push({
      ...message,
      timestamp: message.timestamp || new Date()
    });

    // Keep only the last N messages to prevent memory bloat
    if (this.ephemeralMessages.length > this.maxEphemeralMessages) {
      this.ephemeralMessages = this.ephemeralMessages.slice(-this.maxEphemeralMessages);
    }
  }

  getMessages(): ChatMessage[] {
    return [...this.ephemeralMessages];
  }

  getConversationContext(): string {
    return this.ephemeralMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
  }

  clearEphemeralMessages(): void {
    this.ephemeralMessages = [];
  }

  // Ephemeral key-value storage
  setEphemeral(key: string, value: any): void {
    this.ephemeralData.set(key, value);
  }

  getEphemeral(key: string): any {
    return this.ephemeralData.get(key);
  }

  deleteEphemeral(key: string): boolean {
    return this.ephemeralData.delete(key);
  }

  clearEphemeral(): void {
    this.ephemeralData.clear();
  }

  // Persistent memory via 0G Storage
  async remember(key: string, value: any): Promise<void> {
    const memoryItem: MemoryItem = {
      key,
      value,
      timestamp: new Date(),
      type: 'persistent'
    };

    try {
      // Use KV storage for key-value pairs
      await this.storageClient.uploadKV(this.bucket, key, memoryItem);
    } catch (error) {
      throw new Error(`Failed to store memory item '${key}': ${error}`);
    }
  }

  async recall(key: string): Promise<any> {
    try {
      const memoryItem = await this.storageClient.downloadKV(this.bucket, key);
      return memoryItem?.value || null;
    } catch (error) {
      // Return null if key doesn't exist or other error
      return null;
    }
  }

  async forget(key: string): Promise<void> {
    try {
      // Note: 0G KV doesn't have direct delete, we'll store null value
      await this.storageClient.uploadKV(this.bucket, key, null);
    } catch (error) {
      throw new Error(`Failed to delete memory item '${key}': ${error}`);
    }
  }

  // Utility methods
  async rememberConversation(conversationId: string): Promise<void> {
    await this.remember(`conversation_${conversationId}`, this.ephemeralMessages);
  }

  async recallConversation(conversationId: string): Promise<ChatMessage[]> {
    const messages = await this.recall(`conversation_${conversationId}`);
    return messages || [];
  }

  async listMemoryKeys(): Promise<string[]> {
    // Note: This would require additional 0G Storage API support to list objects
    // For now, we'll return an empty array as a placeholder
    // In a real implementation, you'd need to track keys or use a storage API that supports listing
    return [];
  }

  // Get memory statistics
  getStats(): {
    ephemeralMessages: number;
    ephemeralData: number;
    maxEphemeralMessages: number;
  } {
    return {
      ephemeralMessages: this.ephemeralMessages.length,
      ephemeralData: this.ephemeralData.size,
      maxEphemeralMessages: this.maxEphemeralMessages
    };
  }
}
