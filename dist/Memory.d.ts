import { ZGStorageClient, ChatMessage } from "./types";
export declare class Memory {
    private ephemeralMessages;
    private ephemeralData;
    private storageClient;
    private bucket;
    private maxEphemeralMessages;
    constructor(storageClient: ZGStorageClient, bucket: string, maxEphemeralMessages?: number);
    addMessage(message: ChatMessage): void;
    getMessages(): ChatMessage[];
    getConversationContext(): string;
    clearEphemeralMessages(): void;
    setEphemeral(key: string, value: any): void;
    getEphemeral(key: string): any;
    deleteEphemeral(key: string): boolean;
    clearEphemeral(): void;
    remember(key: string, value: any): Promise<void>;
    recall(key: string): Promise<any>;
    forget(key: string): Promise<void>;
    rememberConversation(conversationId: string): Promise<void>;
    recallConversation(conversationId: string): Promise<ChatMessage[]>;
    listMemoryKeys(): Promise<string[]>;
    getStats(): {
        ephemeralMessages: number;
        ephemeralData: number;
        maxEphemeralMessages: number;
    };
}
//# sourceMappingURL=Memory.d.ts.map