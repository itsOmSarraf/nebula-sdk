import { ProviderConfig, JsonRpcRequest, JsonRpcResponse } from './types/index.js';
import { BaseProvider } from "./BaseProvider.js";
export declare class HttpProvider extends BaseProvider {
    constructor(options: ProviderConfig);
    /**
     * @param data
     * @returns
     */
    _transport(data: JsonRpcRequest): Promise<JsonRpcResponse>;
    _transportBatch(data: JsonRpcRequest[]): Promise<JsonRpcResponse[]>;
}
//# sourceMappingURL=HttpProvider.d.ts.map