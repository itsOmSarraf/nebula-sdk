export function sleep(time = 1000) {
    return new Promise((resolve, reject) => setTimeout(resolve, time));
}
export function awaitTimeout(promise, timeout) {
    return new Promise((resolve, reject) => {
        const error = new Error(`Timeout after ${timeout} ms`);
        const timer = setTimeout(() => reject(error), timeout);
        promise.then(resolve).catch(reject).finally(() => clearTimeout(timer));
    });
}
