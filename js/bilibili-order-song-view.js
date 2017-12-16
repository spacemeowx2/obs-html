define(["require", "exports", "vue"], function (require, exports, vue_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OrderSongComponent = vue_1.default.extend({
        name: 'order-song',
        template: '#order-song',
        data() {
            return {
                tips: 'tips',
                currentSong: 'Test 0:00/1:11'
            };
        }
    });
});
