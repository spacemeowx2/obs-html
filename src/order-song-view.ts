import Vue from 'vue'
import Component from 'vue-class-component'
import { Music } from './common/music-interface'
import { SongRequest } from './bilibili-order-song'
import { Task, delay } from './common/utils'
function padLeft (s: string, padLen: number, padStr: string) {
    if (padStr.length !== 1) throw new Error('length of padstr should be 1')
    const toPadLen = padLen - s.length
    if (toPadLen > 0) {
        return padStr.repeat(toPadLen) + s
    }
    return s
}

function sec2pretty (sec: number) {
    const min = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${padLeft(min.toString(), 2, '0')}:${padLeft(s.toString(), 2, '0')}`
}
export enum ToastColor {
    Success = '#5cb85c',
    Warning = '#f0ad4e'
}
@Component({
    name: 'order-song',
    template: '#order-song',
})
export class OrderSongComponent extends Vue {
    tips = '发送 "!点歌,歌名" 进行点歌'
    currentTime = 0 // in sec
    currentDuration = 0 // in sec
    currentFrom = ''
    queue: SongRequest[] = []
    showItems = 5
    private toastTask = new Task()
    private toast = ''
    private toastShow = false
    private toastColor = ToastColor.Success

    showToast (text: string, color: ToastColor = ToastColor.Success) {
        this.toastTask.add(async () => {
            this.toast = text
            this.toastColor = color
            this.toastShow = true
            await delay(3000)
            this.toastShow = false
            await delay(1000)
        })
    }
    
    get currentSong (): string {
        if (this.queue.length === 0) return '暂无歌曲'
        return `${this.songDisplayName} ${sec2pretty(this.currentTime)} / ${sec2pretty(this.currentDuration)}`
    }
    get curFrom (): string {
        if (this.queue.length === 0) return ''
        const req = this.queue[0]
        return `(${req.from})`
    }
    get list (): SongRequest[] {
        return this.queue.slice(1, 1 + this.showItems)
    }
    get listCount (): number {
        return this.queue.length - 1
    }
    get songDisplayName (): string {
        if (this.queue.length === 0) return '暂无歌曲'
        let cur = this.queue[0].music
        return cur.toString()
    }
}
