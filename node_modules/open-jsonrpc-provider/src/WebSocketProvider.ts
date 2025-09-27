import { w3cwebsocket as Websocket } from 'websocket';
import { EventEmitter } from "events";
import { BaseProvider } from "./BaseProvider.js";
import { JsonRpcRequest, JsonRpcResponse, WSProviderConfig } from './types/index.js';
import { awaitTimeout } from './helper.js';

export class WebSocketProvider extends BaseProvider {
  url: string;
  client: Websocket|null|boolean;
  websocketOptions: WSProviderConfig;

  constructor(options: WSProviderConfig) {
    super(options);
    this.url = options.url;
    this.websocketOptions = options;

    this.client = null;

    this.on('message', json => {
      const data = JSON.parse(json);
      if (Array.isArray(data)) {
        data.forEach(each => this._onData(each));
      } else {
        this._onData(data);
      }
    });
  }

  async _transport(data: JsonRpcRequest): Promise<JsonRpcResponse> {
    await this._send(JSON.stringify(data));
    return (await awaitTimeout(this._awaitId(data.id), this.timeout) || {}) as JsonRpcResponse;
  }

  async _transportBatch(dataArray: JsonRpcRequest[]): Promise<JsonRpcResponse[]> {
    await this._send(JSON.stringify(dataArray));

    return Promise.all(dataArray.map(async data => {
      return (await awaitTimeout(this._awaitId(data.id), this.timeout)) as JsonRpcRequest; 
    }));
  }

  _awaitId(id: number|string) {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      const onClose = (code, message) => {
        this.removeAllListeners(id as string);
        reject(new Error(message));
      };

      // @ts-ignore
      const onData = data => {
        this.removeListener('close', onClose);
        resolve(data);
      };

      this.once('close', onClose);
      this.once(id as string, onData);
    });
  }

  _connect({ url, protocols, origin, headers, requestOptions, clientConfig }: WSProviderConfig): Promise<Websocket> {
    return new Promise((resolve, reject) => {
      const client = new Websocket(url, protocols, origin, headers, requestOptions, clientConfig);
      client.onopen = () => resolve(client);
      client.onerror = e => {
        this.emit('error', e);
        reject(new Error(`connect to "${url}" failed`));
      };
      client.onmessage = ({ data }) => this.emit('message', data);
      client.onclose = ({ code, reason }) => this.emit('close', code, reason);
    });
  }

  _onData(data = {}) {
    // @ts-ignore
    const { id, params: { subscription, result } = {} } = data;
    if (id) {
      this.emit(id, data);
    } else if (subscription) {
      this.emit(subscription, result);
    }
  }

  async _send(data: string) {
    if (this.client === null) { // init
      this.client = false;
      try {
        this.client = await this._connect(this.websocketOptions);
      } catch (e) {
        this.client = null;
        throw e;
      }
    }

    while (this.client === false) { // connecting
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    const client = this.client as Websocket;
    return client.send(data);
  }

  /* async _request(data: object) {
    await this._send(JSON.stringify(data));

    return await awaitTimeout(this._awaitId(data.id), this.timeout) || {};
  } */

  async close() {
    super.close();

    if (this.client === null) { // init
      return;
    }

    while (this.client === false) { // connecting
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    const client = this.client as Websocket;
    client.close();
    await new Promise(resolve => this.once('close', resolve));
    this.client = null;
  }
}