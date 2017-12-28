declare module 'fetch-jsonp' {
    function fetchJsonp(url: string, options?: Options): Promise<Response>
    interface Options {
        timeout?: number
        jsonpCallback?: string
        jsonpCallbackFunction?: string
    }
    interface Response {
        json(): Promise<any>
        json<T>(): Promise<T>
        ok: boolean
    }
    export = fetchJsonp
}
