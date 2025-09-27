"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseProvider = exports.JsonRpcError = void 0;
class JsonRpcError extends Error {
    constructor(message, code, data) {
        super(message);
        this.code = code;
        this.data = data;
    }
}
exports.JsonRpcError = JsonRpcError;
class BaseProvider {
    constructor(options) {
        // super();
        this.url = options.url;
        this.timeout = options.timeout || 30000; // 30 seconds
        this.retry = options.retry || 3;
    }
    _transport(data) {
        throw new Error('_transport not implemented');
    }
    _transportBatch(data) {
        throw new Error('_transportBatch not implemented');
    }
    id() {
        const id = (Date.now() + Math.random()) * 10000;
        return Number(id);
    }
    buildRpcPayload(req) {
        return {
            jsonrpc: '2.0',
            method: req.method,
            params: req.params,
            id: this.id(),
        };
    }
    async request(req) {
        const data = await this._transport(this.buildRpcPayload(req));
        const { result, error } = data;
        if (error)
            throw new JsonRpcError(error.message, error.code, error.data);
        return result;
    }
    async requestBatch(batch) {
        const data = await this._transportBatch(batch.map(this.buildRpcPayload));
        return data.map(({ result, error }) => {
            return error ? new JsonRpcError(error.message, error.code, error.data) : result;
        });
    }
    // legacy methods
    send(method, params) {
        return this.request({ method, params });
    }
    sendAsync(payload, callback) {
        this._transport(payload)
            .then(data => callback(null, data))
            .catch(err => callback(err));
    }
    call(method, ...args) {
        return this.request({ method, params: args });
    }
    close() { }
}
exports.BaseProvider = BaseProvider;
