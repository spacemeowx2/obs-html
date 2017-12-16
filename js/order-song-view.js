var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "vue", "vue-class-component"], function (require, exports, vue_1, vue_class_component_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function padLeft(s, padLen, padStr) {
        if (padStr.length !== 1)
            throw new Error('length of padstr should be 1');
        const toPadLen = padLen - s.length;
        if (toPadLen > 0) {
            return padStr.repeat(toPadLen) + s;
        }
        return s;
    }
    function sec2pretty(sec) {
        const min = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${padLeft(min.toString(), 2, '0')}:${padLeft(s.toString(), 2, '0')}`;
    }
    let OrderSongComponent = class OrderSongComponent extends vue_1.default {
        constructor() {
            super(...arguments);
            this.tips = '发送 "!点歌,歌名" 进行点歌';
            this.currentTime = 0; // in sec
            this.currentDuration = 0; // in sec
            this.currentFrom = '';
            this.toast = '';
            this.queue = [];
            this.showItems = 5;
        }
        get toastShow() {
            return this.toast.length > 0;
        }
        get currentSong() {
            if (this.queue.length === 0)
                return '暂无歌曲';
            return `${this.songDisplayName} ${sec2pretty(this.currentTime)} / ${sec2pretty(this.currentDuration)}`;
        }
        get curFrom() {
            if (this.currentFrom.length > 0) {
                return `(${this.currentFrom})`;
            }
            return '';
        }
        get list() {
            return this.queue.slice(1, 1 + this.showItems);
        }
        get listCount() {
            return this.queue.length - 1;
        }
        get songDisplayName() {
            if (this.queue.length === 0)
                return '暂无歌曲';
            let cur = this.queue[0].music;
            return cur.toString();
        }
    };
    OrderSongComponent = __decorate([
        vue_class_component_1.default({
            name: 'order-song',
            template: '#order-song',
        })
    ], OrderSongComponent);
    exports.OrderSongComponent = OrderSongComponent;
});
