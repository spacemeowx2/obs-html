export function delay (time: number) {
    return new Promise<void>((res) => {
        setTimeout(res, time)
    })
}
