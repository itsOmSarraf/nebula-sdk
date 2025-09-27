export * from './provider.js';

export interface ProviderConfig {
  url: string;
  timeout?: number;
  retry?: number;
  logger?: object;
}

export interface WSClientConfig {
  maxReceivedFrameSize?: number;
  maxReceivedMessageSize?: number;
  closeTimeout?: number;
}

export interface WSProviderConfig extends ProviderConfig {
  protocols?: string[];
  origin?: string;
  headers?: { [key: string]: string };
  requestOptions?: object;
  clientConfig?: WSClientConfig;
}