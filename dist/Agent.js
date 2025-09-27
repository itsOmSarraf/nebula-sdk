"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agent = void 0;
const Memory_1 = require("./Memory");
const Chat_1 = require("./Chat");
class Agent {
    constructor(config, broker, storageClient) {
        this.name = config.name;
        this.memory = new Memory_1.Memory(storageClient, config.memoryBucket, config.maxEphemeralMessages);
        this.chat = new Chat_1.Chat(broker, config.providerAddress, config.temperature, config.maxTokens);
    }
    async init() {
        // Perform any initialization tasks
        try {
            // Test connection to 0G Compute
            await this.chat.getServiceInfo();
            // Load any persistent agent configuration
            const savedConfig = await this.memory.recall('agent_config');
            if (savedConfig) {
                this.systemPrompt = savedConfig.systemPrompt;
            }
        }
        catch (error) {
            throw new Error(`Agent initialization failed: ${error}`);
        }
    }
    setSystemPrompt(prompt) {
        this.systemPrompt = prompt;
    }
    async saveSystemPrompt() {
        if (this.systemPrompt) {
            await this.memory.remember('agent_config', {
                systemPrompt: this.systemPrompt
            });
        }
    }
    async ask(input) {
        // Add user message to memory
        const userMessage = {
            role: 'user',
            content: input,
            timestamp: new Date()
        };
        this.memory.addMessage(userMessage);
        try {
            // Get response from chat
            const response = await this.chat.ask(input, this.systemPrompt);
            // Add assistant response to memory
            const assistantMessage = {
                role: 'assistant',
                content: response,
                timestamp: new Date()
            };
            this.memory.addMessage(assistantMessage);
            return response;
        }
        catch (error) {
            throw new Error(`Chat failed: ${error}`);
        }
    }
    async chatWithContext(input) {
        // Build conversation context from memory
        const messages = [];
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
        const userMessage = {
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
        }
        catch (error) {
            throw new Error(`Context chat failed: ${error}`);
        }
    }
    async streamChat(input, onChunk) {
        // Build conversation context
        const messages = [];
        if (this.systemPrompt) {
            messages.push({
                role: 'system',
                content: this.systemPrompt
            });
        }
        messages.push(...this.memory.getMessages());
        const userMessage = {
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
        }
        catch (error) {
            throw new Error(`Stream chat failed: ${error}`);
        }
    }
    // Memory convenience methods
    async remember(key, value) {
        return this.memory.remember(key, value);
    }
    async recall(key) {
        return this.memory.recall(key);
    }
    async forget(key) {
        return this.memory.forget(key);
    }
    // Conversation management
    async saveConversation(conversationId) {
        const id = conversationId || `conv_${Date.now()}`;
        await this.memory.rememberConversation(id);
        return id;
    }
    async loadConversation(conversationId) {
        const messages = await this.memory.recallConversation(conversationId);
        this.memory.clearEphemeralMessages();
        messages.forEach(msg => this.memory.addMessage(msg));
    }
    clearConversation() {
        this.memory.clearEphemeralMessages();
    }
    // Agent introspection
    getStats() {
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
    setTemperature(temperature) {
        this.chat.setTemperature(temperature);
    }
    setMaxTokens(maxTokens) {
        this.chat.setMaxTokens(maxTokens);
    }
}
exports.Agent = Agent;
//# sourceMappingURL=Agent.js.map