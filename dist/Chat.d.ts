import { ZGComputeBroker, ChatMessage, ChatCompletionResponse, ServiceMetadata } from "./types";
export declare class Chat {
    private broker;
    private providerAddress;
    private temperature;
    private maxTokens;
    constructor(broker: ZGComputeBroker, providerAddress: string, temperature?: number, maxTokens?: number);
    getServiceInfo(): Promise<ServiceMetadata>;
    ask(question: string, systemPrompt?: string): Promise<string>;
    chatCompletion(messages: ChatMessage[]): Promise<ChatCompletionResponse>;
    streamChatCompletion(messages: ChatMessage[], onChunk: (chunk: string) => void): Promise<string>;
    setTemperature(temperature: number): void;
    setMaxTokens(maxTokens: number): void;
    getConfig(): {
        providerAddress: string;
        temperature: number;
        maxTokens: number;
    };
}
//# sourceMappingURL=Chat.d.ts.map