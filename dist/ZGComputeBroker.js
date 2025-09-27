"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZGComputeBrokerImpl = void 0;
exports.createZGComputeNetworkBroker = createZGComputeNetworkBroker;
class ZGComputeBrokerImpl {
    constructor(rpcUrl = "https://evmrpc-testnet.0g.ai") {
        this.inference = {
            async getServiceMetadata(providerAddress) {
                // Query 0G Compute network for provider metadata
                // For now, using a mock implementation with 0G-compatible endpoints
                return {
                    endpoint: `https://compute-testnet.0g.ai/v1/providers/${providerAddress}`,
                    model: "llama-2-7b-chat", // 0G Compute supported model
                    provider: providerAddress
                };
            },
            async getRequestHeaders(providerAddress, content) {
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
        this.rpcUrl = rpcUrl;
    }
}
exports.ZGComputeBrokerImpl = ZGComputeBrokerImpl;
// Factory function to create a broker instance
function createZGComputeNetworkBroker(rpcUrl) {
    return new ZGComputeBrokerImpl(rpcUrl);
}
//# sourceMappingURL=ZGComputeBroker.js.map