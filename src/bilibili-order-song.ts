import { BilibiliDanmaku, DanmuInfo } from "common/bilibili-danmaku"
import { Param } from "common/param"
import { NeteaseMusic } from 'common/netease-music'
new NeteaseMusic()
class Command {
    constructor (public cmd: string, public args: string[], public from: string) {
    }
}

class SongPlayer {
    searchSong (text: string) {
    
    }
    addQueue (from: string, text: string) {

    }
}

class BilibiliOrderSong {
    player: SongPlayer
    constructor (roomid: string) {
        this.player = new SongPlayer()
        if (roomid && roomid.length > 0) {
            let danmu = new BilibiliDanmaku(roomid)
            danmu.onDanmu = (danmu) => this.onDanmu(danmu)
        } else {
            console.error('no roomid')
        }
    }
    onCommand (cmd: Command) {
        console.log(cmd)
        switch (cmd.cmd) {
            case '点歌':
                this.player.addQueue(cmd.from, cmd.args[0])
                break
        }
    }
    onDanmu (danmu: DanmuInfo) {
        console.log('onDanmu', danmu)
        /** @type {string} */
        let txt = danmu.text
        if (txt.startsWith('!') || txt.startsWith('！')) {
            txt = txt.trim()
            txt = txt.substring(1)
            txt = txt.replace(/(，)/g, ',')
            const args = txt.split(',')
            const cmd = new Command(args[0], args.slice(1), danmu.lb)
            this.onCommand(cmd)
        }
    }
}
function bilibiliOrderSong () {
    let roomid = Param.get('roomid', '')
    let orderSong = new BilibiliOrderSong(roomid)
    // @ts-ignore
    window.orderSong = orderSong
}
bilibiliOrderSong()
