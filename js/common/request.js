define(["require", "exports", "axios"], function (require, exports, axios_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function proxyInstance(proxyURL) {
        let inst = axios_1.default.create();
        inst.interceptors.request.use((config) => {
            if (config.url && config.url.match(/^https?:/)) {
                config.headers['X-Proxy-URL'] = config.url;
                config.url = proxyURL;
            }
            return config;
        });
        return inst;
    }
    exports.proxyInstance = proxyInstance;
});
