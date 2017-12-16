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
});
