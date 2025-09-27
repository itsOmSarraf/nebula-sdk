"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.awaitTimeout = exports.sleep = void 0;
function sleep(time = 1000) {
    return new Promise((resolve, reject) => setTimeout(resolve, time));
}
exports.sleep = sleep;
function awaitTimeout(promise, timeout) {
    return new Promise((resolve, reject) => {
        const error = new Error(`Timeout after ${timeout} ms`);
        const timer = setTimeout(() => reject(error), timeout);
        promise.then(resolve).catch(reject).finally(() => clearTimeout(timer));
    });
}
exports.awaitTimeout = awaitTimeout;
