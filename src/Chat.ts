// Note: Using local implementation since @0glabs/0g-serving-broker is not yet available
import { 
  ZGComputeBroker, 
  ChatMessage, 
  ChatCompletionRequest, 
  ChatCompletionResponse, 
  ServiceMetadata 
} from "./types";

export class Chat {
  private broker: ZGComputeBroker;
  private providerAddress: string;
  private temperature: number;
  private maxTokens: number;

  constructor(
    broker: ZGComputeBroker, 
    providerAddress: string, 
    temperature: number = 0.7,
    maxTokens: number = 1000
  ) {
    this.broker = broker;
    this.providerAddress = providerAddress;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
  }

  async getServiceInfo(): Promise<ServiceMetadata> {
    try {
      return await this.broker.inference.getServiceMetadata(this.providerAddress);
    } catch (error) {
      throw new Error(`Failed to get service metadata: ${error}`);
    }
  }

  async ask(question: string, systemPrompt?: string): Promise<string> {
    const messages: ChatMessage[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: question });

    const response = await this.chatCompletion(messages);
    return response.choices[0]?.message?.content || '';
  }

  async chatCompletion(messages: ChatMessage[]): Promise<ChatCompletionResponse> {
    try {
      const { endpoint, model } = await this.getServiceInfo();
      const headers = await this.broker.inference.getRequestHeaders(
        this.providerAddress, 
        messages[messages.length - 1]?.content || ''
      );

      const request: ChatCompletionRequest = {
        messages,
        model,
        temperature: this.temperature,
        max_tokens: this.maxTokens
      };

      const response = await fetch(`${endpoint}/chat/completions`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          ...headers 
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as ChatCompletionResponse;
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response choices returned from the model');
      }

      return data;
    } catch (error) {
      throw new Error(`Chat completion failed: ${error}`);
    }
  }

  async streamChatCompletion(
    messages: ChatMessage[], 
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      const { endpoint, model } = await this.getServiceInfo();
      const headers = await this.broker.inference.getRequestHeaders(
        this.providerAddress, 
        messages[messages.length - 1]?.content || ''
      );

      const request: ChatCompletionRequest = {
        messages,
        model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: true
      };

      const response = await fetch(`${endpoint}/chat/completions`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          ...headers 
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let fullResponse = '';
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  onChunk(content);
                }
              } catch (e) {
                // Skip invalid JSON lines
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return fullResponse;
    } catch (error) {
      throw new Error(`Streaming chat completion failed: ${error}`);
    }
  }

  // Utility methods
  setTemperature(temperature: number): void {
    if (temperature < 0 || temperature > 2) {
      throw new Error('Temperature must be between 0 and 2');
    }
    this.temperature = temperature;
  }

  setMaxTokens(maxTokens: number): void {
    if (maxTokens < 1) {
      throw new Error('Max tokens must be greater than 0');
    }
    this.maxTokens = maxTokens;
  }

  getConfig(): { 
    providerAddress: string; 
    temperature: number; 
    maxTokens: number; 
  } {
    return {
      providerAddress: this.providerAddress,
      temperature: this.temperature,
      maxTokens: this.maxTokens
    };
  }
}
