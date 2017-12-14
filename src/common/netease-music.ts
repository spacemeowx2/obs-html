import { proxyInstance } from "./request"
import { AxiosInstance } from 'axios'

export class NeteaseMusic {
    axios: AxiosInstance
    constructor (proxy = 'https://0579dc8a-8835-4932-9253-e2143ec07833.coding.io/proxy.php') {
        this.axios = proxyInstance(proxy)
        this.axios.get('http://ip.cn').then(async (r) => {
            console.log(r)
        })
    }
}
