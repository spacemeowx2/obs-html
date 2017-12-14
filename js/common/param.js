define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Param {
        static get(name, def) {
            try {
                let search = '';
                search = location.search.substr(1);
                if (this.search === search) {
                    return this.getFromCache(name, def);
                }
                this.cache = new Map();
                for (let s of search.split('&')) {
                    const p = s.split('=');
                    this.cache.set(decodeURIComponent(p[0]), decodeURIComponent(p[1]));
                }
                return this.getFromCache(name, def);
            }
            catch (e) {
                throw new Error('Wrong params in search string: ' + location.search);
            }
        }
        static getFromCache(name, def) {
            if (this.cache.has(name)) {
                let result = this.cache.get(name) || '';
                if (typeof def === 'number') {
                    return parseFloat(result);
                }
                return result;
            }
            else {
                return def;
            }
        }
    }
    Param.search = '';
    Param.cache = new Map();
    exports.Param = Param;
});
