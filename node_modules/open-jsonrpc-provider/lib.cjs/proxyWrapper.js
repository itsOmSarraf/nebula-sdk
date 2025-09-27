"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProxyWrapper = void 0;
function createProxyWrapper(hardhatProvider) {
    const handlers = {
        get(target, prop, receiver) {
            if (target[prop])
                return target[prop];
            return function (...args) {
                return hardhatProvider.request({
                    method: prop,
                    params: args
                });
            };
        }
    };
    const proxy = new Proxy(hardhatProvider, handlers);
    return proxy;
}
exports.createProxyWrapper = createProxyWrapper;
