import { EthereumProvider, RequestArguments, JsonRpcRequest, JsonRpcResponse, ProviderConfig, RpcCallback } from './types/index.js';
export declare class JsonRpcError extends Error {
    code: number;
    data?: unknown;
    constructor(message: string, code: number, data?: unknown);
}
export declare class BaseProvider implements EthereumProvider {
    url: string;
    timeout: number;
    retry: number;
    constructor(options: ProviderConfig);
    _transport(data: JsonRpcRequest): Promise<JsonRpcResponse>;
    _transportBatch(data: JsonRpcRequest[]): Promise<JsonRpcResponse[]>;
    id(): number;
    buildRpcPayload(req: RequestArguments): JsonRpcRequest;
    request(req: RequestArguments): Promise<unknown>;
    requestBatch(batch: RequestArguments[]): Promise<unknown[]>;
    send(method: string, params: any[]): Promise<unknown>;
    sendAsync(payload: JsonRpcRequest, callback: RpcCallback): void;
    call(method: string, ...args: any[]): Promise<unknown>;
    close(): void;
}
//# sourceMappingURL=BaseProvider.d.ts.map