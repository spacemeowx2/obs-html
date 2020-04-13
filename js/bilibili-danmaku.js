var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "./common/param", "./common/utils", "./common/bilibili-danmaku", "./view/danmaku", "axios"], function (require, exports, param_1, utils_1, bilibili_danmaku_1, danmaku_1, axios_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BilibiliDanmakuHelper {
        constructor(roomid, view) {
            this.view = view;
            this.avatarTask = new utils_1.Task();
            this.avatarCache = new Map();
            this.tts = new TTS(param_1.Param.get('ttsint', 200), param_1.Param.get('volume', 0));
            if (roomid && roomid.length > 0) {
                let danmu = new bilibili_danmaku_1.BilibiliDanmaku(roomid);
                let welcome = `Bilibili 弹幕助手 启动! 当前房间号: ${roomid}`;
                this.addLine(welcome);
                // this.tts.addQueue(welcome)
                danmu.onDanmu = (danmu) => this.onDanmu(danmu);
                danmu.onGift = (gift) => this.onGift(gift);
            }
            else {
                this.addLine('Bilibili 弹幕助手 启动!', true);
                this.addLine('请指定房间号', true);
                this.tts.addQueue('请指定房间号');
            }
        }
        onDanmu(danmu) {
            console.log('onDanmu', danmu);
            if (param_1.Param.get('textdanmu', '1') === '1') {
                this.addDanmu(danmu);
            }
            if (param_1.Param.get('ttsdanmu', '1') === '1') {
                if (this.tts.length < 3) {
                    this.tts.addQueue(`${danmu.lb}说 ${danmu.text}`);
                }
            }
        }
        onGift({ giftName, count, sender }) {
            let text = `感谢${sender}的${count}个${giftName}`;
            console.log('onGift', text);
            if (param_1.Param.get('textgift', '1') === '1') {
                this.addLine(text, true);
            }
            if (param_1.Param.get('ttsgift', '1') === '1') {
                this.tts.addQueue(text); // 不管怎样还是要谢啊(逃 辣条刷屏就算了
            }
        }
        addLine(text, persist = false) {
            this.view.addLine(text, persist);
        }
        addDanmu(danmu) {
            const uid = danmu.uid;
            const hit = this.avatarCache.has(uid);
            let avatarReq = () => __awaiter(this, void 0, void 0, function* () {
                try {
                    const dat = (yield axios_1.default(`https://api.bilibili.com/x/web-interface/card?mid=${uid}`)).data;
                    console.log(dat.data.card.face);
                    return dat.data.card.face;
                }
                catch (e) {
                    return undefined;
                }
            });
            this.avatarTask.add(() => __awaiter(this, void 0, void 0, function* () {
                const avatar = yield avatarReq();
                this.view.addDanmaku({
                    sender: {
                        name: danmu.lb,
                        avatar
                    },
                    content: danmu.text
                });
            }));
        }
    }
    class TTS {
        constructor(delay, volume) {
            this.delay = delay;
            this.volume = volume;
            this.length = 0;
            this.chain = Promise.resolve();
        }
        addQueue(text) {
            this.chain = this.chain.then(this.prepare(text)).then(() => utils_1.delay(this.delay));
            this.length++;
        }
        prepare(text) {
            if (this.volume === 0) {
                return () => Promise.resolve();
            }
            text = this.replace(text);
            const query = `type=tns2&idx=1&tex=${encodeURIComponent(text)}&cuid=baidu_speech_demo&cod=2&lan=zh&ctp=1&pdt=1&spd=${param_1.Param.get('spd', '5')}&per=0&vol=10&pit=5`;
            const url = `https://ai.baidu.com/aidemo?${query}`;
            const audio = new Audio(url);
            audio.volume = this.volume;
            return () => new Promise((res) => {
                audio.onended = () => {
                    this.length--;
                    res();
                };
                audio.play();
            });
        }
        replace(text) {
            const re233 = /233+/g;
            if (re233.test(text)) {
                text = text.replace(re233, (s) => s.replace('2', '二').replace(/3/g, '三'));
            }
            const re666 = /666+/g;
            if (re666.test(text)) {
                text = text.replace(re666, '六六六');
            }
            return text;
        }
    }
    function bilibiliDanmaku() {
        let stayTime = param_1.Param.get('stayTime', 60);
        let roomid = param_1.Param.get('roomid', '');
        let view = new danmaku_1.DanmakuListComponent();
        view.stayTime = stayTime;
        view.$mount('#danmaku');
        let helper = new BilibiliDanmakuHelper(roomid, view);
        // @ts-ignore
        window.helper = helper;
    }
    bilibiliDanmaku();
});
