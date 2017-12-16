import { BilibiliDanmaku, DanmuInfo } from "common/bilibili-danmaku"
import { Param } from "common/param"
import { NeteaseMusicAPI } from 'common/netease-music'
import { MusicProvider, Music, MusicError, MusicListener } from 'common/music-interface'
import { OrderSongComponent } from './order-song-view'

class Command {
    constructor (public cmd: string, public args: string[], public from: string) {
    }
}

class SongRequest {
    music?: Music
    constructor (public from: string, public key: string) {
        //
    }
}

class SongList extends Array<SongRequest> {
    constructor (public onChange: () => void = () => null) {
        super()
    }
    push (...items: SongRequest[]) {
        let ret = super.push(...items)
        this.onChange()
        return ret
    }
    unshift (...items: SongRequest[]) {
        let ret = super.unshift(...items)
        this.onChange()
        return ret
    }
    pop () {
        let ret = super.pop()
        this.onChange()
        return ret
    }
    shift () {
        let ret = super.shift()
        this.onChange()
        return ret
    }
}

class SongPreload {
    url: string
    audio: HTMLAudioElement | undefined = new Audio()
    private lifetime: Promise<void>
    constructor (private music: Music) {
        this.lifetime = this.load()
    }
    play () {
        this.lifetime = this.lifetime.then(() => this._play())
        this.lifetime = this.lifetime.then(() => this.untilStop())
        return this.lifetime
    }
    stop () {
        if (this.audio) {
            this.audio.pause()
        }
        this.audio = undefined
    }
    private async load () {
        const music = this.music
        if (!this.audio) return
        const url = await music.provider.getMusicURL(music)
        this.audio.src = url
        this.audio.currentTime // in sec
    }
    private untilStop () {
        return new Promise<void>((res, rej) => {
            if (!this.audio) return res()
            this.audio.onended = () => res()
            this.audio.onerror = () => rej(new MusicError('播放时出现错误'))
        })
    }
    private async _play () {
        if (!this.audio) return
        await this.audio.play()
    }
}
class SongListListener {
    currentReq: SongRequest
    preloads = new WeakMap<SongRequest, SongPreload>()
    playQueue = Promise.resolve()
    constructor (public list: SongList) {
        list.onChange = () => this.onChange()
    }
    onChange () {
        if (this.list.length > 0) {
            if (this.currentReq === this.list[0]) {
                return
            }
            const last = this.currentReq
            const lastPreload = this.preloads.get(last)
            if (lastPreload) {
                lastPreload.stop()
            }
            const current = this.list[0]
            if (!current.music) {
                this.list.shift()
                return
            }
            const pre = new SongPreload(current.music)
            this.preloads.set(current, pre)
            this.currentReq = current
            this.playQueue = this.playQueue.then(() => pre.play())
        }
    }
}

class SongQueue {
    list = new SongList()
    listener = new SongListListener(this.list)
    constructor (private providers: MusicProvider[]) {

    }
    async searchSong (text: string) {
        let music: Music | null = null
        for (let p of this.providers) {
            let list = await p.search(text)
            if (list.length > 0) {
                music = list[0]
                break
            }
        }
        return music
    }
    async add (req: SongRequest) {
        if (this.list.length >= Param.get('max', 10)) {
            throw new MusicError('当前列表满')
        }
        const music = await this.searchSong(req.key)
        if (music) {
            req.music = music
            this.list.push(req)
        } else {
            throw new MusicError('没有找到这首歌')
        }
    }
    revert (from: string) {
        let toDelete: SongRequest | undefined
        for (let req of this.list.reverse()) {
            if (req.from === from) {
                toDelete = req
                break
            }
        }
        if (toDelete) {

        }
        throw new Error(`未找到 ${from} 的点歌记录`)
    }
}

class BilibiliOrderSong implements MusicListener {
    queue: SongQueue
    constructor (roomid: string, view: OrderSongComponent) {
        const netease = new NeteaseMusicAPI('https://ynbjrj-80-fpelhu.myide.io/proxy.php')
        this.queue = new SongQueue([netease])
        if (roomid && roomid.length > 0) {
            let danmu = new BilibiliDanmaku(roomid)
            danmu.onDanmu = (danmu) => this.onDanmu(danmu)
        } else {
            console.error('no roomid')
        }
    }
    async onCommand (cmd: Command) {
        console.log(cmd)
        switch (cmd.cmd) {
            case '点歌':
                try {
                    await this.queue.add(new SongRequest(cmd.from, cmd.args[0]))
                } catch (e) {
                    if (e instanceof MusicError) {
                        this.toast(`${cmd.from} 点歌 ${cmd.args[0]} 失败: ${e.message}`)
                    }
                }
                break
            case '撤回':
                try {
                    this.queue.revert(cmd.from)
                } catch (e) {
                    if (e instanceof MusicError) {
                        this.toast(`${cmd.from} 撤回失败: ${e.message}`)
                    }
                }
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
    onProcess () {

    }
    toast (text: string) {
        console.log(text)
    }
}
let orderSong: BilibiliOrderSong
function bilibiliOrderSong () {
    let roomid = Param.get('roomid', '')
    let view = new OrderSongComponent()
    view.$mount('#order-song')
    orderSong = new BilibiliOrderSong(roomid, view)
    // @ts-ignore
    window.orderSong = orderSong
}
bilibiliOrderSong()
