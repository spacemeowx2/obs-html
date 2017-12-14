import axios from 'axios'

export function proxyInstance (proxyURL: string) {
    let inst = axios.create()
    inst.interceptors.request.use((config) => {
        if (config.url && config.url.match(/^https?:/)) {
            const headers: string[] = []
            for (let key of Object.keys(config.headers)) {
                const value = config.headers[key]
                if (typeof value === 'string') {
                    headers.push(`${key}: ${value}`)
                }
            }
            config.headers = {}
            config.headers['X-PROXY-HEADER'] = JSON.stringify(headers)
            config.headers['X-PROXY-URL'] = config.url
            config.url = proxyURL
        }
        return config
    })
    return inst
}
