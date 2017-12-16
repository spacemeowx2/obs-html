import { BilibiliDanmaku, DanmuInfo } from "common/bilibili-danmaku"
import { Param } from "common/param"
import { NeteaseMusicAPI } from 'common/netease-music'
import { MusicProvider, Music, MusicError, MusicListener } from 'common/music-interface'
import { OrderSongComponent, ToastColor } from './order-song-view'
import { Task } from './common/utils'

class Command {
    constructor (public cmd: string, public args: string[], public from: string) {
    }
}

export class SongRequest {
    music: Music
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
    constructor (private music: Music, private listener: MusicListener<SongRequest>) {
        this.lifetime = this.load()
        this.audio!.volume = Param.get('volume', 0.5)
    }
    play () {
        this.lifetime = this.lifetime.then(() => this._play())
        this.lifetime = this.lifetime.then(() => this.untilStop())
        this.lifetime = this.lifetime.catch((e) => {
            if (e instanceof MusicError) {
                this.listener.onError(e)
            } else {
                this.listener.onError(new MusicError('播放时发生未知错误'))
            }
            console.error(e)
        })
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
            this.audio.onerror = () => res()
            this.audio.onpause = () => res()
        })
    }
    private async _play () {
        if (!this.audio) return
        const audio = this.audio
        audio.ontimeupdate = () => {
            this.listener.onProcess(this.music, audio.currentTime, audio.duration)
        }
        await audio.play()
    }
}

class SongPlayer {
    list = new SongList()

    currentReq: SongRequest
    preloads = new WeakMap<SongRequest, SongPreload>()
    playTask = new Task()
    constructor (private providers: MusicProvider[], private listener: MusicListener<SongRequest>) {
        this.list.onChange = () => this.onChange()
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
        if (!req.music) {
            const music = await this.searchSong(req.key)
            if (!music) {
                throw new MusicError('没有找到这首歌')
            }
            req.music = music
        }
        this.list.push(req)
    }
    revert (from: string) {
        let toDelete: SongRequest | undefined
        const list = this.list
        for (let i = list.length - 1; i >= 0; i++) {
            const req = list[i]
            if (req.from === from) {
                toDelete = req
                break
            }
        }
        if (toDelete) {
            let idx = list.indexOf(toDelete)
            for (let i = idx; i < list.length - 1; i++) {
                list[i] = list[i + 1]
            }
            list.length -= 1
            list.onChange()
        }
        throw new Error(`未找到 ${from} 的点歌记录`)
    }
    private onChange () {
        this.listener.onListUpdate(this.list.slice())
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
            const pre = new SongPreload(current.music, this.listener)
            this.preloads.set(current, pre)
            this.currentReq = current
            this.playTask.add(() => pre.play())
            this.playTask.add(async () => {
                this.list.shift()
            })
        } else {
            const last = this.currentReq
            const lastPreload = this.preloads.get(last)
            if (lastPreload) {
                lastPreload.stop()
            }
        }
    }
}

class BilibiliOrderSong implements MusicListener<SongRequest> {
    queue: SongPlayer
    netease: NeteaseMusicAPI
    constructor (roomid: string, private view: OrderSongComponent) {
        this.netease = new NeteaseMusicAPI('http://f7e9bb0b-e035-47fb-ac1c-338a86bb5663.coding.io/proxy.php')
        this.queue = new SongPlayer([this.netease], this)
        if (roomid && roomid.length > 0) {
            let danmu = new BilibiliDanmaku(roomid)
            danmu.onDanmu = (danmu) => this.onDanmu(danmu)
        } else {
            console.error('no roomid')
        }
    }
    async onCommand (cmd: Command) {
        console.log(cmd)
        switch (cmd.cmd.toUpperCase()) {
            case '网易云ID':
                try {
                    let music = await this.netease.getMusicById(parseInt(cmd.args[0]))
                    let req = new SongRequest(cmd.from, cmd.args[0])
                    req.music = music
                    await this.queue.add(req)
                } catch (e) {
                    if (e instanceof MusicError) {
                        this.toast(`${cmd.from} 点歌 ${cmd.args[0]} 失败: ${e.message}`)
                    }
                }
                break
            case '点歌':
                try {
                    await this.queue.add(new SongRequest(cmd.from, cmd.args[0]))
                    this.toast(`${cmd.from} 点歌成功`, true)
                } catch (e) {
                    if (e instanceof MusicError) {
                        this.toast(`${cmd.from} 点歌 ${cmd.args[0]} 失败: ${e.message}`)
                    }
                }
                break
            case '撤回':
                try {
                    this.queue.revert(cmd.from)
                    this.toast(`${cmd.from} 撤回成功`, true)
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
    onListUpdate (list: SongRequest[]) {
        this.view.queue = list
    }
    onProcess (music: Music, currentTime: number, durationTime: number) {
        this.view.currentTime = currentTime
        this.view.currentDuration = durationTime
    }
    onError (e: any) {
        if (e instanceof MusicError) {
            this.toast(e.message)
        }
    }
    toast (text: string, success: boolean = false) {
        this.view.showToast(text, success ? ToastColor.Success : ToastColor.Warning)
    }
}
let orderSong: BilibiliOrderSong
function bilibiliOrderSong () {
    let roomid = Param.get('roomid', '')
    let view = new OrderSongComponent()
    view.$mount('#order-song')
    orderSong = new BilibiliOrderSong(roomid, view)
    // @ts-ignore
    window.orderView = view
    // @ts-ignore
    window.orderSong = orderSong
}
bilibiliOrderSong()
