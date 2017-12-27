var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "common/bilibili-danmaku", "common/param", "common/netease-music", "common/music-interface", "./order-song-view", "./common/utils"], function (require, exports, bilibili_danmaku_1, param_1, netease_music_1, music_interface_1, order_song_view_1, utils_1) {
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
    exports.SongRequest = SongRequest;
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
        constructor(music, listener) {
            this.music = music;
            this.listener = listener;
            this.audio = new Audio();
            this.audio.volume = param_1.Param.get('volume', 0.5);
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
        play() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.load();
                    if (!this.audio)
                        return;
                    const audio = this.audio;
                    audio.ontimeupdate = () => {
                        this.listener.onProcess(this.music, audio.currentTime, audio.duration);
                    };
                    yield audio.play();
                }
                catch (e) {
                    if (e instanceof music_interface_1.MusicError) {
                        this.listener.onError(e);
                    }
                    else {
                        this.listener.onError(new music_interface_1.MusicError('播放时发生未知错误'));
                    }
                    console.error(e);
                }
            });
        }
        untilStop() {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.play();
                yield new Promise((res, rej) => {
                    if (!this.audio)
                        return res();
                    this.audio.onended = () => res();
                    this.audio.onerror = () => res();
                    this.audio.onpause = () => res();
                });
            });
        }
    }
    __decorate([
        utils_1.once()
    ], SongPreload.prototype, "load", null);
    __decorate([
        utils_1.once()
    ], SongPreload.prototype, "play", null);
    class SongPlayer {
        constructor(providers, listener) {
            this.providers = providers;
            this.listener = listener;
            this.list = new SongList();
            this.preloads = new WeakMap();
            this.playTask = new utils_1.Task();
            this.list.onChange = () => this.onChange();
        }
        searchSong(text) {
            return __awaiter(this, void 0, void 0, function* () {
                let music = null;
                for (let p of this.providers) {
                    let list = yield p.search(text);
                    if (list.length > 0) {
                        music = list;
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
                if (!req.music) {
                    const music = yield this.searchSong(req.key);
                    if (!music) {
                        throw new music_interface_1.MusicError('没有找到这首歌');
                    }
                    req.music = music;
                }
                this.list.push(req);
            });
        }
        revert(from) {
            let toDelete;
            const list = this.list;
            for (let i = list.length - 1; i >= 0; i++) {
                const req = list[i];
                if (req.from === from) {
                    toDelete = req;
                    break;
                }
            }
            if (toDelete) {
                let idx = list.indexOf(toDelete);
                for (let i = idx; i < list.length - 1; i++) {
                    list[i] = list[i + 1];
                }
                list.length -= 1;
                list.onChange();
            }
            throw new Error(`未找到 ${from} 的点歌记录`);
        }
        onChange() {
            this.listener.onListUpdate(this.list.slice());
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
                this.playTask.add(() => __awaiter(this, void 0, void 0, function* () {
                    let success = false;
                    for (let music of current.music) {
                        const pre = new SongPreload(music, this.listener);
                        try {
                            yield pre.load();
                            this.preloads.set(current, pre);
                            success = true;
                            this.currentReq = current;
                            yield pre.play();
                            break;
                        }
                        catch (e) {
                        }
                    }
                    if (!success) {
                        this.listener.onError(new music_interface_1.MusicError(`无法加载 ${current.from}: ${current.key}`));
                    }
                    this.list.shift();
                }));
            }
            else {
                const last = this.currentReq;
                const lastPreload = this.preloads.get(last);
                if (lastPreload) {
                    lastPreload.stop();
                }
            }
        }
    }
    class BilibiliOrderSong {
        constructor(roomid, view) {
            this.view = view;
            this.freeTimeAlbum = -1;
            this.netease = new netease_music_1.NeteaseMusicAPI('http://f7e9bb0b-e035-47fb-ac1c-338a86bb5663.coding.io/proxy.php');
            this.queue = new SongPlayer([this.netease], this);
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
                switch (cmd.cmd.toUpperCase()) {
                    case '网易云ID':
                        try {
                            let music = yield this.netease.getMusicById(parseInt(cmd.args[0]));
                            let req = new SongRequest(cmd.from, cmd.args[0]);
                            req.music = [music];
                            yield this.queue.add(req);
                        }
                        catch (e) {
                            if (e instanceof music_interface_1.MusicError) {
                                this.toast(`${cmd.from} 点歌 ${cmd.args[0]} 失败: ${e.message}`);
                            }
                        }
                        break;
                    case '点歌':
                        try {
                            yield this.queue.add(new SongRequest(cmd.from, cmd.args[0]));
                            this.toast(`${cmd.from} 点歌成功`, true);
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
                            this.toast(`${cmd.from} 撤回成功`, true);
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
        onListUpdate(list) {
            this.view.queue = list;
        }
        onProcess(music, currentTime, durationTime) {
            this.view.currentTime = currentTime;
            this.view.currentDuration = durationTime;
        }
        onError(e) {
            if (e instanceof music_interface_1.MusicError) {
                this.toast(e.message);
            }
        }
        toast(text, success = false) {
            this.view.showToast(text, success ? order_song_view_1.ToastColor.Success : order_song_view_1.ToastColor.Warning);
        }
    }
    let orderSong;
    function bilibiliOrderSong() {
        let roomid = param_1.Param.get('roomid', '');
        let view = new order_song_view_1.OrderSongComponent();
        view.$mount('#order-song');
        orderSong = new BilibiliOrderSong(roomid, view);
        orderSong.freeTimeAlbum = param_1.Param.get('freeTimeAlbum', -1);
        // @ts-ignore
        window.orderView = view;
        // @ts-ignore
        window.orderSong = orderSong;
    }
    bilibiliOrderSong();
});
