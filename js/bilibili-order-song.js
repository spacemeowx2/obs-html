define(["require", "exports", "common/bilibili-danmaku", "common/param", "common/netease-music"], function (require, exports, bilibili_danmaku_1, param_1, netease_music_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    new netease_music_1.NeteaseMusicAPI();
    class Command {
        constructor(cmd, args, from) {
            this.cmd = cmd;
            this.args = args;
            this.from = from;
        }
    }
    class SongPlayer {
        searchSong(text) {
        }
        addQueue(from, text) {
        }
    }
    class BilibiliOrderSong {
        constructor(roomid) {
            this.player = new SongPlayer();
            if (roomid && roomid.length > 0) {
                let danmu = new bilibili_danmaku_1.BilibiliDanmaku(roomid);
                danmu.onDanmu = (danmu) => this.onDanmu(danmu);
            }
            else {
                console.error('no roomid');
            }
        }
        onCommand(cmd) {
            console.log(cmd);
            switch (cmd.cmd) {
                case '点歌':
                    this.player.addQueue(cmd.from, cmd.args[0]);
                    break;
            }
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
    }
    function bilibiliOrderSong() {
        let roomid = param_1.Param.get('roomid', '');
        let orderSong = new BilibiliOrderSong(roomid);
        // @ts-ignore
        window.orderSong = orderSong;
    }
    bilibiliOrderSong();
});
