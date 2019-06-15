var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "./common/param", "./common/bilibili-danmaku", "matter-js", "axios"], function (require, exports, param_1, bilibili_danmaku_1, matter_js_1, axios_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const GiftMap = new Map();
    function debug(d) {
        document.getElementById('debug').innerText += d + '\n';
    }
    function debugClick() {
        // @ts-ignore
        window.pe.handleGift({ giftId: 1 });
        debug('click');
    }
    class BilibiliPE {
        constructor() {
            this.engine = matter_js_1.Engine.create();
            this.render = matter_js_1.Render.create({
                canvas: document.getElementById('canvas'),
                engine: this.engine,
                options: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                    // @ts-ignore
                    background: 'transparent',
                    // @ts-ignore
                    wireframeBackground: 'transparent',
                    wireframes: false
                }
            });
            this.canvas = this.render.canvas;
            this.ground = matter_js_1.Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
            const { engine, render, ground } = this;
            const boxA = matter_js_1.Bodies.rectangle(400, 200, 80, 80);
            const boxB = matter_js_1.Bodies.rectangle(450, 50, 80, 80);
            matter_js_1.World.add(engine.world, [boxA, boxB, ground]);
            matter_js_1.Engine.run(engine);
            matter_js_1.Render.run(render);
            window.addEventListener('resize', () => this.resize());
        }
        resize() {
            const canvas = this.render.canvas;
            const { innerWidth, innerHeight } = window;
            canvas.width = innerWidth;
            canvas.height = innerHeight;
        }
        get width() {
            return this.canvas.width;
        }
        get height() {
            return this.canvas.height;
        }
        handleDanmu(danmu) {
            console.log('danmu', danmu);
        }
        handleGift(gift) {
            console.log('gift', gift);
            const info = GiftMap.get(gift.giftId);
            let render;
            if (info) {
                render = {
                    sprite: {
                        texture: info.img_dynamic,
                        xScale: 1,
                        yScale: 1
                    }
                };
            }
            else {
                render = {
                    sprite: {
                        texture: 'https://i0.hdslb.com/bfs/live/d57afb7c5596359970eb430655c6aef501a268ab.png',
                        xScale: 40 / 140,
                        yScale: 40 / 140
                    }
                };
                console.error('gift not found', gift);
            }
            let circle;
            if (render) {
                circle = matter_js_1.Bodies.circle(this.width - 15, 30, 20, {
                    render
                });
            }
            else {
                circle = matter_js_1.Bodies.circle(this.width - 15, 30, 20, {
                    render
                });
            }
            matter_js_1.Body.setVelocity(circle, { x: -10, y: 0 });
            matter_js_1.World.add(this.engine.world, circle);
        }
    }
    function bilibiliPE() {
        return __awaiter(this, void 0, void 0, function* () {
            let roomid = param_1.Param.get('roomid', '');
            try {
                const r = yield axios_1.default.get('https://api.live.bilibili.com/gift/v3/live/gift_config');
                for (const g of r.data.data) {
                    GiftMap.set(g.id, g);
                }
            }
            catch (e) {
                debug('failed to get bilibili gift info');
            }
            if (roomid) {
                const danmu = new bilibili_danmaku_1.BilibiliDanmaku(roomid);
                const pe = new BilibiliPE();
                danmu.onDanmu = (danmu) => pe.handleDanmu(danmu);
                danmu.onGift = (gift) => pe.handleGift(gift);
                // @ts-ignore
                window.pe = pe;
                window.addEventListener('click', debugClick);
            }
        });
    }
    bilibiliPE();
});
