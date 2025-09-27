import { Memory } from "./Memory";
import { Chat } from "./Chat";
import { AgentConfig, ZGComputeBroker, ZGStorageClient } from "./types";
export declare class Agent {
    readonly name: string;
    readonly memory: Memory;
    readonly chat: Chat;
    private systemPrompt?;
    constructor(config: AgentConfig, broker: ZGComputeBroker, storageClient: ZGStorageClient);
    init(): Promise<void>;
    setSystemPrompt(prompt: string): void;
    saveSystemPrompt(): Promise<void>;
    ask(input: string): Promise<string>;
    chatWithContext(input: string): Promise<string>;
    streamChat(input: string, onChunk: (chunk: string) => void): Promise<string>;
    remember(key: string, value: any): Promise<void>;
    recall(key: string): Promise<any>;
    forget(key: string): Promise<void>;
    saveConversation(conversationId?: string): Promise<string>;
    loadConversation(conversationId: string): Promise<void>;
    clearConversation(): void;
    getStats(): {
        name: string;
        memory: ReturnType<Memory['getStats']>;
        chat: ReturnType<Chat['getConfig']>;
        systemPrompt?: string;
    };
    getServiceInfo(): Promise<import("./types").ServiceMetadata>;
    setTemperature(temperature: number): void;
    setMaxTokens(maxTokens: number): void;
}
//# sourceMappingURL=Agent.d.ts.map