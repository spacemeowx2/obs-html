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
