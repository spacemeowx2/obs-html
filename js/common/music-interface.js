define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MusicError extends Error {
    }
    exports.MusicError = MusicError;
    class Music {
        constructor(music) {
            if (music) {
                this.name = music.name;
                this.author = music.author;
                this.duration = music.duration;
                this.provider = music.provider;
            }
        }
        toString() {
            return `${this.name} - ${this.author}`;
        }
    }
    exports.Music = Music;
});
