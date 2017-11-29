class Param {
    static get (name, def) {
        try {
            let search = ''
            search = location.search.substr(1)
            if (this.search === search) {
                return this.cache.has(name) ? this.cache.get(name) : def
            }
            this.cache = new Map()
            for (let s of search.split('&')) {
                const p = s.split('=')
                this.cache.set(decodeURIComponent(p[0]), decodeURIComponent(p[1]))
            }
            return this.cache.has(name) ? this.cache.get(name) : def
        } catch (e) {
            throw new Error('Wrong params in search string: ' + search)
        }
    }
}
window.Param = Param
