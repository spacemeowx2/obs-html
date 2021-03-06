var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "./common/param", "./common/bilibili-danmaku", "matter-js", "axios"], function (require, exports, param_1, bilibili_danmaku_1, matter_js_1, axios_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const MaxWidth = 5000;
    const MaxHeight = 5000;
    const GiftMap = new Map();
    function debug(d) {
        document.getElementById('debug').innerText += d + '\n';
    }
    function debugClick() {
        // @ts-ignore
        // window.pe.handleGift({giftId: 1, count: 100})
        // @ts-ignore
        window.pe.handleDanmu({ text: 'test' });
    }
    class BilibiliPE {
        constructor() {
            this.engine = matter_js_1.Engine.create({
                enableSleeping: true
            });
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
            this.ground = matter_js_1.Bodies.rectangle(400, 610, MaxWidth, 60, { isStatic: true });
            this.bodies = [];
            this.giftQueue = [];
            this.danmuQueue = [];
            const { engine, render, ground } = this;
            matter_js_1.World.add(engine.world, [ground]);
            matter_js_1.Engine.run(engine);
            matter_js_1.Render.run(render);
            this.resize();
            window.addEventListener('resize', () => this.resize());
            setInterval(() => {
                for (let b of this.bodies) {
                    const { isSleeping, position: { x, y } } = b;
                    if (isSleeping) {
                        matter_js_1.World.remove(engine.world, b);
                    }
                    if (x < -100 || x > (MaxWidth + 100) || y < -100 || y > (MaxHeight + 100)) {
                        matter_js_1.World.remove(engine.world, b);
                    }
                }
            }, 5000);
            setInterval(() => {
                const r = this.giftQueue.shift();
                if (r) {
                    this.fireGift(r);
                }
            }, 100);
            setInterval(() => {
                const d = this.danmuQueue[0];
                if (d) {
                    if (d.text.length === 0) {
                        this.danmuQueue.shift();
                        return;
                    }
                    const c = d.text[0];
                    d.text = d.text.slice(1);
                    this.fireChar(c);
                }
            }, 100);
        }
        resize() {
            const canvas = this.render.canvas;
            let { innerWidth, innerHeight } = window;
            innerWidth = Math.min(MaxWidth, innerWidth);
            innerHeight = Math.min(MaxHeight, innerHeight);
            canvas.width = innerWidth;
            canvas.height = innerHeight;
            matter_js_1.Body.setPosition(this.ground, { x: 0, y: innerHeight + 30 });
        }
        get width() {
            return this.canvas.width;
        }
        get height() {
            return this.canvas.height;
        }
        renderChar(t) {
            const size = 40;
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return;
            }
            ctx.font = '32px 微软雅黑';
            ctx.strokeStyle = '#000000';
            ctx.fillStyle = '#FFFFFF';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillText(t, size / 2, size / 2);
            ctx.strokeText(t, size / 2, size / 2);
            return canvas.toDataURL();
        }
        fireChar(char) {
            const url = this.renderChar(char);
            if (url) {
                const r = 25;
                const circle = matter_js_1.Bodies.circle(this.width - r / 2, 30, r, {
                    render: {
                        sprite: {
                            texture: url,
                            xScale: 1,
                            yScale: 1
                        }
                    }
                });
                matter_js_1.Body.setVelocity(circle, { x: -10, y: 0 });
                matter_js_1.Body.setAngularVelocity(circle, -0.05 + 0.1 * Math.random());
                matter_js_1.World.add(this.engine.world, circle);
                this.bodies.push(circle);
            }
        }
        fireGift(render, imgR = 140) {
            const r = 25;
            const circle = matter_js_1.Bodies.circle(this.width - r / 2, 30, r, {
                render
            });
            render.sprite.xScale = ((r * 2) / imgR);
            render.sprite.yScale = ((r * 2) / imgR);
            matter_js_1.Body.setVelocity(circle, { x: -(10 + Math.random() * 5), y: (Math.random()) * 2 * 5 });
            matter_js_1.Body.setAngularVelocity(circle, -0.05 + 0.1 * Math.random());
            matter_js_1.World.add(this.engine.world, circle);
            this.bodies.push(circle);
        }
        handleDanmu(danmu) {
            console.log('danmu', danmu);
            this.danmuQueue.push({ text: danmu.text });
        }
        handleGift(gift) {
            console.log('gift', gift);
            const info = GiftMap.get(gift.giftId);
            let render;
            if (info) {
                render = {
                    sprite: {
                        texture: info.img_dynamic,
                        xScale: 40 / 140,
                        yScale: 40 / 140
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
            for (let i = 0; i < gift.count; i++) {
                this.giftQueue.push(render);
            }
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
