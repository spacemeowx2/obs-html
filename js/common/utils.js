define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function delay(time) {
        return new Promise((res) => {
            setTimeout(res, time);
        });
    }
    exports.delay = delay;
});
