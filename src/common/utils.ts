export function delay (time: number) {
    return new Promise<void>((res) => {
        setTimeout(res, time)
    })
}
export class TaskError extends Error {}
export class Task {
    private waitAbort: () => void | undefined
    private chain: Promise<void> = Promise.resolve()
    private checkAbort = () => {
        if (this.waitAbort) {
            this.waitAbort()
            throw new TaskError('Task aborted')
        }
    }
    add (promiseFactory: () => Promise<void>) {
        if (this.waitAbort) {
            throw new TaskError('Task has been aborted')
        }
        this.chain = this.chain.then(promiseFactory).then(this.checkAbort)
    }
    abort () {
        return new Promise((res, rej) => {
            this.waitAbort = res
        })
    }
}
export function isThenable (v: any) {
    return typeof v.then === 'function'
}
export function once() {
    const StateNone = 0
    const StatePending = 1
    const StateDone = 2
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        let state = StateNone
        let lastRet: any
        let lastErr: any
        let resolve: Function[] | undefined = []
        let reject: Function[] | undefined  = []
        function thenRunner (funcs: Function[], value: any) {
            for (let f of funcs) {
                f(value)
            }
            state = StateDone
            resolve = undefined
            reject = undefined
        }
        const oriMethod: Function = descriptor.value
        descriptor.value = function (...args: any[]) {
            if (state === StateDone) {
                if (lastErr) {
                    throw lastErr
                }
                return lastRet
            } else if (state === StatePending) {
                return new Promise((res, rej) => {
                    resolve!.push(res)
                    reject!.push(rej)
                })
            } else if (state === StateNone) {
                let ret
                try {
                    ret = oriMethod.call(this, ...args)
                } catch (e) {
                    lastErr = e
                    throw e
                }
                if (isThenable(ret)) {
                    state = StatePending
                    ret.then((r: any) => {
                        thenRunner(resolve!, r)
                        lastRet = r
                    }, (r: any) => {
                        thenRunner(reject!, r)
                        lastErr = r
                    })
                    return new Promise((res, rej) => {
                        resolve!.push(res)
                        reject!.push(rej)
                    })
                }
                state = StateDone
                lastRet = ret
                return ret
            } else {
                throw new Error('Wrong state')
            }
        }
    }
}
