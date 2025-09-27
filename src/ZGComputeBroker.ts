import { ZGComputeBroker, ServiceMetadata } from "./types";

export class ZGComputeBrokerImpl implements ZGComputeBroker {
  private rpcUrl: string;

  constructor(rpcUrl: string = "https://evmrpc-testnet.0g.ai") {
    this.rpcUrl = rpcUrl;
  }

  inference = {
    async getServiceMetadata(providerAddress: string): Promise<ServiceMetadata> {
      // Query 0G Compute network for provider metadata
      // For now, using a mock implementation with 0G-compatible endpoints
      return {
        endpoint: `https://compute-testnet.0g.ai/v1/providers/${providerAddress}`,
        model: "llama-2-7b-chat", // 0G Compute supported model
        provider: providerAddress
      };
    },

    async getRequestHeaders(providerAddress: string, content: string): Promise<Record<string, string>> {
      // Generate authenticated headers for 0G Compute
      // This would typically involve signing the request with the user's wallet
      return {
        "Content-Type": "application/json",
        "X-Provider-Address": providerAddress,
        "X-0G-Network": "testnet",
        "User-Agent": "0G-AI-SDK/1.0.0"
      };
    }
  };
}

// Factory function to create a broker instance
export function createZGComputeNetworkBroker(rpcUrl?: string): ZGComputeBroker {
  return new ZGComputeBrokerImpl(rpcUrl);
}
