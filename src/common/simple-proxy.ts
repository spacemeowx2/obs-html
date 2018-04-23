import { AxiosRequestConfig } from 'axios'
interface SimpleResponse<T> {
    status: number
    header: {
        [key: string]: string
    },
    data: T
}
const node = 'ws://localhost:22083/'
export function request<T> (config: AxiosRequestConfig): Promise<SimpleResponse<T>> {
    return new Promise((res, rej) => {
        const ws = new WebSocket(node)
        ws.onopen = () => {
            ws.send('axios')
            ws.send(JSON.stringify(config))
        }
        ws.onmessage = e => {
            // console.log(e.data)
            res(JSON.parse(e.data))
        }
        ws.onclose = e => rej(e)
        ws.onerror = e => rej(e)
    })
}
export async function get<T = any> (url: string) {
    const config = {
        method: 'GET',
        url
    }
    return (await request<T>(config)).data
}
