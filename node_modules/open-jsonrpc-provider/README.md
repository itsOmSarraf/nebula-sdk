# open-jsonrpc-provider

A provider can be used in javascript projects

## Features

1. Implement [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193)  ✅
2. Compatible with `send`, `call`, `request`, `sendAsync` standard  ✅
3. Support HTTP  ✅
4. Support WebSocket  ✅
5. Support middleware
6. Support proxy mode ✅

## Guides

### Install

```sh
npm install open-jsonrpc-provider
```

### How to use

```js
const { HttpProvider } = require('open-jsonrpc-provider');

const provider = new HttpProvider({
  url: 'http://localhost:8545',
});

provider.request({
  method: 'eth_blockNumber',
  params: []
}).then(console.log);
```

## TODO

- [ ] Support both browser and nodejs
- [ ] Provide two module standard: `commonjs` and `esm`

## Other Implementations

- [MetaMask-providers](https://github.com/MetaMask/providers)
- [eth-provider](https://github.com/floating/eth-provider)
- [ethers.js](https://github.com/ethers-io/ethers.js/blob/56af4413b1dd1787db68985e0b612b63d86fdf7c/packages/providers/src.ts/web3-provider.ts)
- [hardhat](https://github.com/NomicFoundation/hardhat/pull/608)
