var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const node = 'ws://localhost:22083/';
    function request(config) {
        return new Promise((res, rej) => {
            const ws = new WebSocket(node);
            ws.onopen = () => {
                ws.send('axios');
                ws.send(JSON.stringify(config));
            };
            ws.onmessage = e => {
                // console.log(e.data)
                res(JSON.parse(e.data));
            };
            ws.onclose = e => rej(e);
            ws.onerror = e => rej(e);
        });
    }
    exports.request = request;
    function get(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = {
                method: 'GET',
                url
            };
            return (yield request(config)).data;
        });
    }
    exports.get = get;
});
