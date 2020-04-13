var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "vue", "vue-class-component"], function (require, exports, vue_1, vue_class_component_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DanmakuComponent = class DanmakuComponent extends vue_1.default {
    };
    DanmakuComponent = __decorate([
        vue_class_component_1.default({
            name: 'danmaku',
            template: '#danmaku-template',
            props: ['sender', 'content']
        })
    ], DanmakuComponent);
    let DanmakuListComponent = class DanmakuListComponent extends vue_1.default {
        constructor() {
            super(...arguments);
            this.listLimit = 50;
            this.list = [];
            this.nextId = 1;
            this.stayTime = 60;
        }
        danmakuKey(danmaku) {
            return danmaku.id.toString();
        }
        addLine(text, persist = false) {
            this.addDanmaku({
                content: text
            }, persist);
        }
        addDanmaku(danmu, persist = false) {
            const item = Object.assign(Object.assign({}, danmu), { id: this.nextId++ });
            this.list.push(item);
            if (!persist) {
                setTimeout(() => {
                    const id = this.list.indexOf(item);
                    if (id !== -1) {
                        this.list.splice(id, 1);
                    }
                }, this.stayTime * 1000);
            }
            this.checkListLimit();
        }
        checkListLimit() {
            const more = 5;
            if (this.list.length > this.listLimit + more) {
                this.list.splice(0, more);
            }
        }
    };
    DanmakuListComponent = __decorate([
        vue_class_component_1.default({
            name: 'danmaku-list',
            template: '#danmaku-list-template',
            props: {
                'avatar': {
                    default: false
                }
            },
            components: {
                'danmaku': DanmakuComponent
            }
        })
    ], DanmakuListComponent);
    exports.DanmakuListComponent = DanmakuListComponent;
});
