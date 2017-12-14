import axios from 'axios'

export function proxyInstance (proxyURL: string) {
    let inst = axios.create()
    inst.interceptors.request.use((config) => {
        if (config.url && config.url.match(/^https?:/)) {
            config.headers['X-Proxy-URL'] = config.url
            config.url = proxyURL
        }
        return config
    })
    return inst
}
