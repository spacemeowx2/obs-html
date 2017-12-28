export function delay (time: number) {
    return new Promise<void>((res) => {
        setTimeout(res, time)
    })
}
export class TaskError extends Error {}
export class Task {
    private _busy = false
    private waitAbort: () => void | undefined
    private chain: Promise<void> = Promise.resolve()
    private checkAbort = () => {
        if (this.waitAbort) {
            this.waitAbort()
            throw new TaskError('Task aborted')
        }
    }
    get busy () {
        return this._busy
    }
    add (promiseFactory: () => Promise<void>) {
        if (this.waitAbort) {
            throw new TaskError('Task has been aborted')
        }
        this.chain = this.chain.then(() => {
            this._busy = true
        })
        this.chain = this.chain.then(promiseFactory).then(this.checkAbort)
        this.chain = this.chain.then(() => {
            this._busy = false
        })
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
const StateNone = 0
const StatePending = 1
const StateDone = 2
class OnceClass {
    static map = new Map<string, WeakMap<any, OnceClass>>()
    static get (target: any, propertyKey: string): OnceClass {
        if (!this.map.has(propertyKey)) {
            this.map.set(propertyKey, new WeakMap())
        }
        const p = this.map.get(propertyKey)!
        if (!p.has(target)) {
            p.set(target, new this(target))
        }
        return p.get(target)!
    }
    state = StateNone
    lastRet: any
    lastErr: any
    resolve: Function[] | undefined = []
    reject: Function[] | undefined = []
    constructor (private that: any) {}
    thenRunner (funcs: Function[], value: any) {
        for (let f of funcs) {
            f(value)
        }
        this.state = StateDone
        this.resolve = undefined
        this.reject = undefined
    }
    run (oriMethod: Function, ...args: any[]) {
        if (this.state === StateDone) {
            if (this.lastErr) {
                throw this.lastErr
            }
            return this.lastRet
        } else if (this.state === StatePending) {
            return new Promise((res, rej) => {
                this.resolve!.push(res)
                this.reject!.push(rej)
            })
        } else if (this.state === StateNone) {
            let ret
            try {
                ret = oriMethod.call(this.that, ...args)
            } catch (e) {
                this.lastErr = e
                throw e
            }
            if (isThenable(ret)) {
                this.state = StatePending
                ret.then((r: any) => {
                    this.thenRunner(this.resolve!, r)
                    this.lastRet = r
                }, (r: any) => {
                    this.thenRunner(this.reject!, r)
                    this.lastErr = r
                })
                return new Promise((res, rej) => {
                    this.resolve!.push(res)
                    this.reject!.push(rej)
                })
            }
            this.state = StateDone
            this.lastRet = ret
            return ret
        } else {
            throw new Error('Wrong state')
        }
    }
}
export function once() {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        let state = StateNone
        let lastRet: any
        let lastErr: any
        let resolve: Function[] | undefined = []
        let reject: Function[] | undefined  = []
        const oriMethod: Function = descriptor.value
        descriptor.value = function (...args: any[]) {
            let o = OnceClass.get(this, propertyKey)
            return o.run(oriMethod, ...args)
        }
    }
}
