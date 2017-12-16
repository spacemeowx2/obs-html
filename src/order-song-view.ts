import Vue from 'vue'
import { Music } from './common/music-interface'
import Component from 'vue-class-component'

function padLeft (s: string, padLen: number, padStr: string) {
    if (padStr.length !== 1) throw new Error('length of padstr should be 1')
    const toPadLen = padLen - s.length
    if (toPadLen > 0) {
        return padStr.repeat(toPadLen) + s
    }
}

function sec2pretty (sec: number) {
    const min = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${padLeft(min.toString(), 2, '0')}:${padLeft(s.toString(), 2, '0')}`
}
@Component({
    name: 'order-song',
    template: '#order-song',
})
export class OrderSongComponent extends Vue {
    tips = '发送 "!点歌,歌名" 进行点歌'
    currentTime = 0 // in sec
    currentDuration = 0 // in sec
    toast = ''
    queue = new Array<Music>()
    
    get toastShow (): boolean {
        return this.toast.length > 0
    }
    get currentSong (): string {
        return `${this.songDisplayName} ${sec2pretty(this.currentTime)} / ${sec2pretty(this.currentDuration)}`
    }
    get list (): Music[] {
        return this.queue.slice(1)
    }
    get songDisplayName (): string {
        if (this.queue.length === 0) return '暂无歌曲'
        let cur = this.queue[0]
        return `${cur.name} - ${cur.author}`
    }
}
export const OrderSongComponent2 = Vue.extend({
    name: 'order-song',
    template: '#order-song',
    data () {
        return {
            tips: '发送 "!点歌,歌名" 进行点歌',
            currentTime: 0, // in sec
            currentDuration: 0, // in sec
            toast: '',
            queue: new Array<Music>()
        }
    },
    computed: {
        toastShow (): boolean {
            return this.toast.length > 0
        },
        currentSong (): string {
            return `${this.songDisplayName} ${sec2pretty(this.currentTime)} / ${sec2pretty(this.currentDuration)}`
        },
        list (): Music[] {
            return this.queue.slice(1)
        },
        songDisplayName (): string {
            if (this.queue.length === 0) return '暂无歌曲'
            let cur = this.queue[0]
            return `${cur.name} - ${cur.author}`
        }
    }
})
