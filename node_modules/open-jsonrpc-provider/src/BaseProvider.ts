// import { EventEmitter } from "events";
import { 
  EthereumProvider, 
  RequestArguments,
  JsonRpcRequest,
  JsonRpcResponse,
  ProviderConfig,
  RpcCallback,
} from './types/index.js';

export class JsonRpcError extends Error {
  code: number;
  data?: unknown;

  constructor(message: string, code: number, data?: unknown) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

export class BaseProvider implements EthereumProvider { //  extends EventEmitter
  url: string;
  timeout: number;
  retry: number;
  
  constructor(options: ProviderConfig) {
    // super();
    this.url = options.url;
    this.timeout = options.timeout || 30000; // 30 seconds
    this.retry = options.retry || 3;
  }

  _transport(data: JsonRpcRequest): Promise<JsonRpcResponse> {
    throw new Error('_transport not implemented');
  }

  _transportBatch(data: JsonRpcRequest[]): Promise<JsonRpcResponse[]> {
    throw new Error('_transportBatch not implemented');
  }

  id(): number {
    const id = (Date.now() + Math.random()) * 10000;
    return Number(id);
  }

  buildRpcPayload(req: RequestArguments): JsonRpcRequest {
    return {
      jsonrpc: '2.0',
      method: req.method,
      params: req.params,
      id: this.id(),
    };
  }

  async request(req: RequestArguments): Promise<unknown> {
    const data = await this._transport(this.buildRpcPayload(req));
    const { result, error } = data as JsonRpcResponse;
    if (error) throw new JsonRpcError(error.message, error.code, error.data);
    return result;
  }

  async requestBatch(batch: RequestArguments[]): Promise<unknown[]> {
    const data = await this._transportBatch(batch.map(this.buildRpcPayload));
    return data.map(({ result, error }) => {
      return error ? new JsonRpcError(error.message, error.code, error.data) : result;
    });
  }

  // legacy methods
  send(method: string, params: any[]): Promise<unknown> {
    return this.request({method, params});
  }

  sendAsync(payload: JsonRpcRequest, callback: RpcCallback): void {
    this._transport(payload)
      .then(data => callback(null, data as JsonRpcResponse))
      .catch(err => callback(err));
  }

  call(method: string, ...args: any[]): Promise<unknown> {
    return this.request({method, params: args});
  }

  close() {}
}