var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "axios", "./netease-crypto", "./music-interface"], function (require, exports, axios_1, netease_crypto_1, music_interface_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const NETEASE_API_URL = 'http://music.163.com/weapi';
    class NeteaseMusicAPI {
        constructor(proxy = 'https://0579dc8a-8835-4932-9253-e2143ec07833.coding.io/proxy.php') {
            this.musicNM = new WeakMap();
            this.axios = axios_1.default.create();
            this.axios.interceptors.request.use((config) => {
                if (config.url && config.url.match(/^https?:/)) {
                    const overrideHeaders = {
                        'Origin': 'http://music.163.com',
                        'Referer': 'http://music.163.com',
                        'User-Agent': randomUserAgent(),
                        'X-Real-IP': randomChinaIpAddress(),
                        'Connection': 'keep-alive',
                        'Content-Type': 'application/x-www-form-urlencoded',
                    };
                    config.headers['X-PROXY-HEADER'] = this.headers2ProxyHeader(overrideHeaders);
                    config.headers['X-PROXY-URL'] = config.url;
                    config.url = proxy;
                }
                return config;
            });
        }
        headers2ProxyHeader(hs) {
            return JSON.stringify(Object.keys(hs).map(k => `${k}: ${hs[k]}`));
        }
        request(api, data) {
            let qs = Object.keys(data).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(data[k])}`).join('&');
            return this.axios.post(NETEASE_API_URL + api, qs);
        }
        song2Music(song) {
            let ret = {
                name: song.name,
                author: song.ar.map(a => a.name).join('/'),
                duration: song.dt / 1000,
                provider: this,
                toString() {
                    return `${this.name} - ${this.author}`;
                }
            };
            this.musicNM.set(ret, song);
            return ret;
        }
        search(key) {
            return __awaiter(this, void 0, void 0, function* () {
                const limit = 30;
                const page = 1;
                const obj = {
                    s: key,
                    type: 1,
                    limit: 30,
                    offset: (page - 1) * limit,
                };
                const encData = netease_crypto_1.aesRsaEncrypt(JSON.stringify(obj));
                const res = yield this.request('/cloudsearch/get/web?csrf_token=', encData);
                const data = res.data;
                if (data.code !== 200 /* OK */) {
                    throw new music_interface_1.MusicError('搜索失败');
                }
                let ret = [];
                for (let song of data.result.songs) {
                    ret.push(this.song2Music(song));
                }
                return ret;
            });
        }
        getMusicURL(music) {
            return __awaiter(this, void 0, void 0, function* () {
                const song = this.musicNM.get(music);
                if (!song) {
                    throw new Error('获取歌曲地址失败');
                }
                let br;
                if (song.m) {
                    br = song.m.br;
                }
                return yield this.getMusicURLById(song.id, br);
            });
        }
        getMusicURLById(id, br) {
            return __awaiter(this, void 0, void 0, function* () {
                const obj = {
                    ids: [id],
                    br: br || 999000,
                    csrf_token: '',
                };
                const encData = netease_crypto_1.aesRsaEncrypt(JSON.stringify(obj));
                const res = yield this.request('/song/enhance/player/url', encData);
                const data = res.data.data;
                if (res.data.code !== 200 /* OK */ || data.length === 0) {
                    throw new music_interface_1.MusicError('获取歌曲地址失败');
                }
                return data[0].url;
            });
        }
    }
    exports.NeteaseMusicAPI = NeteaseMusicAPI;
    function randomUserAgent() {
        const userAgentList = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
            'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_2 like Mac OS X) AppleWebKit/603.2.4 (KHTML, like Gecko) Mobile/14F89;GameHelper',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/603.2.4 (KHTML, like Gecko) Version/10.1.1 Safari/603.2.4',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A300 Safari/602.1',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:46.0) Gecko/20100101 Firefox/46.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:46.0) Gecko/20100101 Firefox/46.0',
            'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)',
            'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)',
            'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
            'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Win64; x64; Trident/6.0)',
            'Mozilla/5.0 (Windows NT 6.3; Win64, x64; Trident/7.0; rv:11.0) like Gecko',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/13.10586',
            'Mozilla/5.0 (iPad; CPU OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A300 Safari/602.1',
        ];
        const num = Math.floor(Math.random() * userAgentList.length);
        return userAgentList[num];
    }
    function randomChinaIpAddress() {
        return `211.161.244.${Math.floor(254 * Math.random())}`;
    }
});
