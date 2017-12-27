define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function delay(time) {
        return new Promise((res) => {
            setTimeout(res, time);
        });
    }
    exports.delay = delay;
    class TaskError extends Error {
    }
    exports.TaskError = TaskError;
    class Task {
        constructor() {
            this.chain = Promise.resolve();
            this.checkAbort = () => {
                if (this.waitAbort) {
                    this.waitAbort();
                    throw new TaskError('Task aborted');
                }
            };
        }
        add(promiseFactory) {
            if (this.waitAbort) {
                throw new TaskError('Task has been aborted');
            }
            this.chain = this.chain.then(promiseFactory).then(this.checkAbort);
        }
        abort() {
            return new Promise((res, rej) => {
                this.waitAbort = res;
            });
        }
    }
    exports.Task = Task;
    function isThenable(v) {
        return typeof v.then === 'function';
    }
    exports.isThenable = isThenable;
    function once() {
        const StateNone = 0;
        const StatePending = 1;
        const StateDone = 2;
        return (target, propertyKey, descriptor) => {
            let state = StateNone;
            let lastRet;
            let lastErr;
            let resolve = [];
            let reject = [];
            function thenRunner(funcs, value) {
                for (let f of funcs) {
                    f(value);
                }
                state = StateDone;
                resolve = undefined;
                reject = undefined;
            }
            const oriMethod = descriptor.value;
            descriptor.value = function (...args) {
                if (state === StateDone) {
                    if (lastErr) {
                        throw lastErr;
                    }
                    return lastRet;
                }
                else if (state === StatePending) {
                    return new Promise((res, rej) => {
                        resolve.push(res);
                        reject.push(rej);
                    });
                }
                else if (state === StateNone) {
                    let ret;
                    try {
                        ret = oriMethod.call(this, ...args);
                    }
                    catch (e) {
                        lastErr = e;
                        throw e;
                    }
                    if (isThenable(ret)) {
                        state = StatePending;
                        ret.then((r) => {
                            thenRunner(resolve, r);
                            lastRet = r;
                        }, (r) => {
                            thenRunner(reject, r);
                            lastErr = r;
                        });
                        return new Promise((res, rej) => {
                            resolve.push(res);
                            reject.push(rej);
                        });
                    }
                    state = StateDone;
                    lastRet = ret;
                    return ret;
                }
                else {
                    throw new Error('Wrong state');
                }
            };
        };
    }
    exports.once = once;
});
