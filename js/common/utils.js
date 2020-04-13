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
            this._busy = false;
            this.waitAbort = undefined;
            this.chain = Promise.resolve();
            this.checkAbort = () => {
                if (this.waitAbort) {
                    this.waitAbort();
                    throw new TaskError('Task aborted');
                }
            };
        }
        get busy() {
            return this._busy;
        }
        add(promiseFactory) {
            if (this.waitAbort) {
                throw new TaskError('Task has been aborted');
            }
            this.chain = this.chain.then(() => {
                this._busy = true;
            });
            this.chain = this.chain.then(promiseFactory).then(this.checkAbort);
            this.chain = this.chain.then(() => {
                this._busy = false;
            });
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
    const StateNone = 0;
    const StatePending = 1;
    const StateDone = 2;
    class OnceClass {
        constructor(that) {
            this.that = that;
            this.state = StateNone;
            this.resolve = [];
            this.reject = [];
        }
        static get(target, propertyKey) {
            if (!this.map.has(propertyKey)) {
                this.map.set(propertyKey, new WeakMap());
            }
            const p = this.map.get(propertyKey);
            if (!p.has(target)) {
                p.set(target, new this(target));
            }
            return p.get(target);
        }
        thenRunner(funcs, value) {
            for (let f of funcs) {
                f(value);
            }
            this.state = StateDone;
            this.resolve = undefined;
            this.reject = undefined;
        }
        run(oriMethod, ...args) {
            if (this.state === StateDone) {
                if (this.lastErr) {
                    throw this.lastErr;
                }
                return this.lastRet;
            }
            else if (this.state === StatePending) {
                return new Promise((res, rej) => {
                    this.resolve.push(res);
                    this.reject.push(rej);
                });
            }
            else if (this.state === StateNone) {
                let ret;
                try {
                    ret = oriMethod.call(this.that, ...args);
                }
                catch (e) {
                    this.lastErr = e;
                    throw e;
                }
                if (isThenable(ret)) {
                    this.state = StatePending;
                    ret.then((r) => {
                        this.thenRunner(this.resolve, r);
                        this.lastRet = r;
                    }, (r) => {
                        this.thenRunner(this.reject, r);
                        this.lastErr = r;
                    });
                    return new Promise((res, rej) => {
                        this.resolve.push(res);
                        this.reject.push(rej);
                    });
                }
                this.state = StateDone;
                this.lastRet = ret;
                return ret;
            }
            else {
                throw new Error('Wrong state');
            }
        }
    }
    OnceClass.map = new Map();
    function once() {
        return (target, propertyKey, descriptor) => {
            let state = StateNone;
            let lastRet;
            let lastErr;
            let resolve = [];
            let reject = [];
            const oriMethod = descriptor.value;
            descriptor.value = function (...args) {
                let o = OnceClass.get(this, propertyKey);
                return o.run(oriMethod, ...args);
            };
        };
    }
    exports.once = once;
});
