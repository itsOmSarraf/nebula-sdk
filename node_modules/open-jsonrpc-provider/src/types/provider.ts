// import { EventEmitter } from "events";

export interface RequestArguments {
  readonly method: string;
  readonly params?: readonly unknown[] | object;
}

export interface ProviderRpcError extends Error {
  code: number;
  data?: unknown;
}

export interface ProviderMessage {
  readonly type: string;
  readonly data: unknown;
}

export interface EthSubscription extends ProviderMessage {
  readonly type: "eth_subscription";
  readonly data: {
    readonly subscription: string;
    readonly result: unknown;
  };
}

export interface CfxSubscription extends ProviderMessage {
  readonly type: "cfx_subscription";
  readonly data: {
    readonly subscription: string;
    readonly result: unknown;
  };
}

export interface ProviderConnectInfo {
  readonly chainId: string;
}

interface EIP1193Provider { //  extends EventEmitter
  request(req: RequestArguments): Promise<unknown>;
}

export interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params?: readonly unknown[] | object;
  id: number;
}

export interface JsonRpcError extends Error {
    code: number;
    data?: any;
}

export interface JsonRpcResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: JsonRpcError;
}

export type RpcCallback = (error: any, response?: JsonRpcResponse) => void;

export interface EthereumProvider extends EIP1193Provider {
  send(method: string, params?: any[]): Promise<any>;
  sendAsync(payload: JsonRpcRequest, callback: RpcCallback): void;
  call(method: string, ...args: any[]): Promise<unknown>;
}
