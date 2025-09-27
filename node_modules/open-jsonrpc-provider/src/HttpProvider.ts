import axios from 'axios';
import { ProviderConfig, JsonRpcRequest, JsonRpcResponse } from './types/index.js';
import { BaseProvider } from "./BaseProvider.js";
import { sleep } from './helper.js';

export class HttpProvider extends BaseProvider {
  constructor(options: ProviderConfig) {
    super(options);
  }

  /**
   * @param data 
   * @returns 
   */
  async _transport(data: JsonRpcRequest): Promise<JsonRpcResponse> {
    let leftTries = this.retry;
    let error = null;
    while (leftTries > 0) {
      try {
        const response = await axios({
          url: this.url,
          method: 'post',
          data,
          timeout: this.timeout,
        });
        return response.data;
      } catch(_error) {
        error = _error;
      }
      await sleep(1000);  // sleep 1 second
      leftTries--;
    }
    throw error;
  }

  _transportBatch(data: JsonRpcRequest[]): Promise<JsonRpcResponse[]> {
    // @ts-ignore
    return this._transport(data);
  }
}