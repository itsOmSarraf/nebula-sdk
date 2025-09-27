"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Memory = void 0;
class Memory {
    constructor(storageClient, bucket, maxEphemeralMessages = 50) {
        this.ephemeralMessages = [];
        this.ephemeralData = new Map();
        this.storageClient = storageClient;
        this.bucket = bucket;
        this.maxEphemeralMessages = maxEphemeralMessages;
    }
    // Ephemeral memory for conversation context
    addMessage(message) {
        this.ephemeralMessages.push({
            ...message,
            timestamp: message.timestamp || new Date()
        });
        // Keep only the last N messages to prevent memory bloat
        if (this.ephemeralMessages.length > this.maxEphemeralMessages) {
            this.ephemeralMessages = this.ephemeralMessages.slice(-this.maxEphemeralMessages);
        }
    }
    getMessages() {
        return [...this.ephemeralMessages];
    }
    getConversationContext() {
        return this.ephemeralMessages
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n');
    }
    clearEphemeralMessages() {
        this.ephemeralMessages = [];
    }
    // Ephemeral key-value storage
    setEphemeral(key, value) {
        this.ephemeralData.set(key, value);
    }
    getEphemeral(key) {
        return this.ephemeralData.get(key);
    }
    deleteEphemeral(key) {
        return this.ephemeralData.delete(key);
    }
    clearEphemeral() {
        this.ephemeralData.clear();
    }
    // Persistent memory via 0G Storage
    async remember(key, value) {
        const memoryItem = {
            key,
            value,
            timestamp: new Date(),
            type: 'persistent'
        };
        try {
            // Use KV storage for key-value pairs
            await this.storageClient.uploadKV(this.bucket, key, memoryItem);
        }
        catch (error) {
            throw new Error(`Failed to store memory item '${key}': ${error}`);
        }
    }
    async recall(key) {
        try {
            const memoryItem = await this.storageClient.downloadKV(this.bucket, key);
            return memoryItem?.value || null;
        }
        catch (error) {
            // Return null if key doesn't exist or other error
            return null;
        }
    }
    async forget(key) {
        try {
            // Note: 0G KV doesn't have direct delete, we'll store null value
            await this.storageClient.uploadKV(this.bucket, key, null);
        }
        catch (error) {
            throw new Error(`Failed to delete memory item '${key}': ${error}`);
        }
    }
    // Utility methods
    async rememberConversation(conversationId) {
        await this.remember(`conversation_${conversationId}`, this.ephemeralMessages);
    }
    async recallConversation(conversationId) {
        const messages = await this.recall(`conversation_${conversationId}`);
        return messages || [];
    }
    async listMemoryKeys() {
        // Note: This would require additional 0G Storage API support to list objects
        // For now, we'll return an empty array as a placeholder
        // In a real implementation, you'd need to track keys or use a storage API that supports listing
        return [];
    }
    // Get memory statistics
    getStats() {
        return {
            ephemeralMessages: this.ephemeralMessages.length,
            ephemeralData: this.ephemeralData.size,
            maxEphemeralMessages: this.maxEphemeralMessages
        };
    }
}
exports.Memory = Memory;
//# sourceMappingURL=Memory.js.map