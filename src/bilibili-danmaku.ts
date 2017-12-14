import { Param } from './common/param'
import { delay } from './common/utils'
import { BilibiliDanmaku, GiftInfo, DanmuInfo } from './common/bilibili-danmaku'
class BilibiliDanmakuHelper {
    tts: TTS
    constructor (roomid: string) {
        this.tts = new TTS(Param.get('ttsint', 200), Param.get('volume', 0))
        if (roomid && roomid.length > 0) {
            let danmu = new BilibiliDanmaku(roomid)
            let welcome = `Bilibili 弹幕助手 启动! 当前房间号: ${roomid}`
            this.addLine(welcome)
            this.tts.addQueue(welcome)
            danmu.onDanmu = (danmu) => this.onDanmu(danmu)
            danmu.onGift = (gift) => this.onGift(gift)
        } else {
            this.addLine('Bilibili 弹幕助手 启动!')
            this.addLine('请指定房间号')
            this.tts.addQueue('请指定房间号')
        }
    }
    onDanmu (danmu: DanmuInfo) {
        console.log('onDanmu', danmu)
        if (Param.get('textdanmu', '1') === '1') {
            this.addLine(`${danmu.lb}: ${danmu.text}`)
        }
        if (Param.get('ttsdanmu', '1') === '1') {
            if (this.tts.length < 3) {
                this.tts.addQueue(`${danmu.lb}说 ${danmu.text}`)
            }
        }
    }
    onGift ({giftName, count, sender}: GiftInfo) {
        let text = `感谢${sender}的${count}个${giftName}`
        console.log('onGift', text)
        if (Param.get('textgift', '1') === '1') {
            this.addLine(text)
        }
        if (Param.get('ttsgift', '1') === '1') {
            this.tts.addQueue(text) // 不管怎样还是要谢啊(逃 辣条刷屏就算了
        }
    }
    addLine (text: string) {
        const list = document.getElementById('list')!
        const danmaku = document.getElementById('danmaku')
        const li = document.createElement('li')
        li.innerText = text
        list.appendChild(li)
        if (list.children.length > 50) {
            list.children[0].remove()
        }
    }
}
class TTS {
    delay: number
    volume: number
    length: number
    chain: Promise<void>
    constructor (delay: number, volume: number) {
        this.delay = delay
        this.volume = volume
        this.length = 0
        this.chain = Promise.resolve()
    }
    addQueue (text: string) {
        this.chain = this.chain.then(this.prepare(text)).then(() => delay(this.delay))
        this.length++
    }
    prepare (text: string) {
        if (this.volume === 0) {
            return () => Promise.resolve()
        }
        text = this.replace(text)
        const url = `http://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&spd=7&text=${encodeURIComponent(text)}`
        const audio = new Audio(url)
        audio.volume = this.volume
        
        return () => new Promise<void>((res) => {
            audio.onended = () => {
                this.length--
                res()
            }
            audio.play()
        })
    }
    replace (text: string) {
        const re233 = /233+/g
        if (re233.test(text)) {
            text = text.replace(re233, (s) => s.replace('2', '二').replace(/3/g, '三'))
        }
        const re666 = /666+/g
        if (re666.test(text)) {
            text = text.replace(re666, '六六六')
        }
        return text
    }
}
function bilibiliDanmaku () {
    let roomid = Param.get('roomid', '')
    let helper = new BilibiliDanmakuHelper(roomid)
    // @ts-ignore
    window.helper = helper
}
bilibiliDanmaku()
