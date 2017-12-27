type acceptable = string | number
export class Param {
    static search: string = ''
    static cache: Map<string, string> = new Map()
    static get<T extends acceptable> (name: string, def: T) {
        name = name.toLowerCase()
        try {
            let search = ''
            search = location.search.substr(1)
            if (this.search === search) {
                return this.getFromCache(name, def)
            }
            this.cache = new Map()
            for (let s of search.split('&')) {
                const p = s.split('=')
                this.cache.set(decodeURIComponent(p[0]).toLowerCase(), decodeURIComponent(p[1]))
            }
            return this.getFromCache(name, def)
        } catch (e) {
            throw new Error('Wrong params in search string: ' + location.search)
        }
    }
    private static getFromCache<T extends acceptable> (name: string, def: T): T {
        if (this.cache.has(name)) {
            let result = this.cache.get(name) || ''
            if (typeof def === 'number') {
                return parseFloat(result) as any
            }
            return result as any
        } else {
            return def
        }
    }
}
