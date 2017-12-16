var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "common/bilibili-danmaku", "common/param", "common/netease-music", "common/music-interface", "./order-song-view"], function (require, exports, bilibili_danmaku_1, param_1, netease_music_1, music_interface_1, order_song_view_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Command {
        constructor(cmd, args, from) {
            this.cmd = cmd;
            this.args = args;
            this.from = from;
        }
    }
    class SongRequest {
        constructor(from, key) {
            this.from = from;
            this.key = key;
            //
        }
    }
    class SongList extends Array {
        constructor(onChange = () => null) {
            super();
            this.onChange = onChange;
        }
        push(...items) {
            let ret = super.push(...items);
            this.onChange();
            return ret;
        }
        unshift(...items) {
            let ret = super.unshift(...items);
            this.onChange();
            return ret;
        }
        pop() {
            let ret = super.pop();
            this.onChange();
            return ret;
        }
        shift() {
            let ret = super.shift();
            this.onChange();
            return ret;
        }
    }
    class SongPreload {
        constructor(music) {
            this.music = music;
            this.audio = new Audio();
            this.lifetime = this.load();
        }
        play() {
            this.lifetime = this.lifetime.then(() => this._play());
            this.lifetime = this.lifetime.then(() => this.untilStop());
            return this.lifetime;
        }
        stop() {
            if (this.audio) {
                this.audio.pause();
            }
            this.audio = undefined;
        }
        load() {
            return __awaiter(this, void 0, void 0, function* () {
                const music = this.music;
                if (!this.audio)
                    return;
                const url = yield music.provider.getMusicURL(music);
                this.audio.src = url;
                this.audio.currentTime; // in sec
            });
        }
        untilStop() {
            return new Promise((res, rej) => {
                if (!this.audio)
                    return res();
                this.audio.onended = () => res();
                this.audio.onerror = () => rej(new music_interface_1.MusicError('播放时出现错误'));
            });
        }
        _play() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!this.audio)
                    return;
                yield this.audio.play();
            });
        }
    }
    class SongListListener {
        constructor(list) {
            this.list = list;
            this.preloads = new WeakMap();
            this.playQueue = Promise.resolve();
            list.onChange = () => this.onChange();
        }
        onChange() {
            if (this.list.length > 0) {
                if (this.currentReq === this.list[0]) {
                    return;
                }
                const last = this.currentReq;
                const lastPreload = this.preloads.get(last);
                if (lastPreload) {
                    lastPreload.stop();
                }
                const current = this.list[0];
                if (!current.music) {
                    this.list.shift();
                    return;
                }
                const pre = new SongPreload(current.music);
                this.preloads.set(current, pre);
                this.currentReq = current;
                this.playQueue = this.playQueue.then(() => pre.play());
            }
        }
    }
    class SongQueue {
        constructor(providers) {
            this.providers = providers;
            this.list = new SongList();
            this.listener = new SongListListener(this.list);
        }
        searchSong(text) {
            return __awaiter(this, void 0, void 0, function* () {
                let music = null;
                for (let p of this.providers) {
                    let list = yield p.search(text);
                    if (list.length > 0) {
                        music = list[0];
                        break;
                    }
                }
                return music;
            });
        }
        add(req) {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.list.length >= param_1.Param.get('max', 10)) {
                    throw new music_interface_1.MusicError('当前列表满');
                }
                const music = yield this.searchSong(req.key);
                if (music) {
                    req.music = music;
                    this.list.push(req);
                }
                else {
                    throw new music_interface_1.MusicError('没有找到这首歌');
                }
            });
        }
        revert(from) {
            let toDelete;
            for (let req of this.list.reverse()) {
                if (req.from === from) {
                    toDelete = req;
                    break;
                }
            }
            if (toDelete) {
            }
            throw new Error(`未找到 ${from} 的点歌记录`);
        }
    }
    class BilibiliOrderSong {
        constructor(roomid, view) {
            const netease = new netease_music_1.NeteaseMusicAPI('https://ynbjrj-80-fpelhu.myide.io/proxy.php');
            this.queue = new SongQueue([netease]);
            if (roomid && roomid.length > 0) {
                let danmu = new bilibili_danmaku_1.BilibiliDanmaku(roomid);
                danmu.onDanmu = (danmu) => this.onDanmu(danmu);
            }
            else {
                console.error('no roomid');
            }
        }
        onCommand(cmd) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log(cmd);
                switch (cmd.cmd) {
                    case '点歌':
                        try {
                            yield this.queue.add(new SongRequest(cmd.from, cmd.args[0]));
                        }
                        catch (e) {
                            if (e instanceof music_interface_1.MusicError) {
                                this.toast(`${cmd.from} 点歌 ${cmd.args[0]} 失败: ${e.message}`);
                            }
                        }
                        break;
                    case '撤回':
                        try {
                            this.queue.revert(cmd.from);
                        }
                        catch (e) {
                            if (e instanceof music_interface_1.MusicError) {
                                this.toast(`${cmd.from} 撤回失败: ${e.message}`);
                            }
                        }
                        break;
                }
            });
        }
        onDanmu(danmu) {
            console.log('onDanmu', danmu);
            /** @type {string} */
            let txt = danmu.text;
            if (txt.startsWith('!') || txt.startsWith('！')) {
                txt = txt.trim();
                txt = txt.substring(1);
                txt = txt.replace(/(，)/g, ',');
                const args = txt.split(',');
                const cmd = new Command(args[0], args.slice(1), danmu.lb);
                this.onCommand(cmd);
            }
        }
        onProcess() {
        }
        toast(text) {
            console.log(text);
        }
    }
    let orderSong;
    function bilibiliOrderSong() {
        let roomid = param_1.Param.get('roomid', '');
        let view = new order_song_view_1.OrderSongComponent();
        view.$mount('#order-song');
        orderSong = new BilibiliOrderSong(roomid, view);
        // @ts-ignore
        window.orderSong = orderSong;
    }
    bilibiliOrderSong();
});
