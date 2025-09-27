import { EthereumProvider } from './types/index.js'

export function createProxyWrapper(hardhatProvider: EthereumProvider): EthereumProvider {
  
  const handlers = {
    get(target: any, prop: any, receiver: EthereumProvider) {
      if (target[prop]) return target[prop];

      return function(...args: any[]) {
        return hardhatProvider.request({
          method: prop,
          params: args
        });
      };
    }
  };

  const proxy = new Proxy(hardhatProvider, handlers);
  return proxy as EthereumProvider;
}