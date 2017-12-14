define(["require", "exports", "axios"], function (require, exports, axios_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function proxyInstance(proxyURL) {
        let inst = axios_1.default.create();
        inst.interceptors.request.use((config) => {
            if (config.url && config.url.match(/^https?:/)) {
                const headers = [];
                for (let key of Object.keys(config.headers)) {
                    const value = config.headers[key];
                    if (typeof value === 'string') {
                        headers.push(`${key}: ${value}`);
                    }
                }
                config.headers = {};
                config.headers['X-PROXY-HEADER'] = JSON.stringify(headers);
                config.headers['X-PROXY-URL'] = config.url;
                config.url = proxyURL;
            }
            return config;
        });
        return inst;
    }
    exports.proxyInstance = proxyInstance;
});
