// @ts-check
class BilibiliDanmakuHelper {
    constructor (roomid) {
        this.tts = new TTS(Param.get('ttsint', 200), Param.get('volume', 0))
        if (roomid && roomid.length > 0) {
            let danmu = new BilibiliDanmaku(roomid)
            let welcome = `Bilibili 弹幕助手 启动! 当前房间号: ${roomid}`
            this.addLine(welcome)
            this.tts.addQueue(welcome)
            danmu.onMessage = (pkg) => {
                switch (pkg.op) {
                    case 5:
                        this.onMessage(pkg.payload)
                        break
                }
            }
        } else {
            this.addLine('Bilibili 弹幕助手 启动!')
            this.addLine('请指定房间号')
            this.tts.addQueue('请指定房间号')
        }
    }
    onDanmu (danmu) {
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
    onGift (giftName, count, sender) {
        let text = `感谢${sender}的${count}个${giftName}`
        console.log('onGift', text)
        if (Param.get('textgift', '1') === '1') {
            this.addLine(text)
        }
        if (Param.get('ttsgift', '1') === '1') {
            this.tts.addQueue(text) // 不管怎样还是要谢啊(逃 辣条刷屏就算了
        }
    }
    onMessage (payload) {
        try {
            let data = JSON.parse(payload)
            switch (data.cmd) {
                case 'DANMU_MSG':
                    let danmu = this.parseDanmu(data.info)
                    this.onDanmu(danmu)
                    break
                case 'SEND_GIFT':
                    let gift = data.data
                    this.onGift(gift.giftName, gift.num, gift.uname)
                    break
                default:
                    console.log('ignore unknown cmd: ', data.cmd)
            }
        } catch (e) {
            console.error(e)
        }
    }
    addLine (text) {
        const list = document.getElementById('list')
        const danmaku = document.getElementById('danmaku')
        const li = document.createElement('li')
        li.innerText = text
        list.appendChild(li)
        if (list.children.length > 50) {
            list.children[0].remove()
        }
    }
    parseDanmu (p) {
        return {
            ha: -1,
            mode: p[0][1],
            size: p[0][2],
            color: p[0][3],
            uid: p[2][0],
            wg: p[0][5],
            text: p[1],
            lb: p[2][1],
            I: {
                level: p[4][0],
                Sr: p[2][5],
                verify: !!p[2][6]
            }
        }
    }
}
function delay (time) {
    return new Promise((res) => {
        setTimeout(res, time)
    })
}
class TTS {
    constructor (delay, volume) {
        this.delay = delay
        this.volume = volume
        this.length = 0
        this.chain = Promise.resolve()
    }
    addQueue (text) {
        this.chain = this.chain.then(this.prepare(text)).then(() => delay(this.delay))
        this.length++
    }
    prepare (text) {
        if (this.volume === 0) {
            return () => Promise.resolve()
        }
        text = this.replace(text)
        const url = `http://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&spd=${Param.get('speed', 7)}&text=${encodeURIComponent(text)}`
        const audio = new Audio(url)
        audio.volume = this.volume
        
        return () => new Promise((res) => {
            audio.onended = () => {
                this.length--
                res()
            }
            audio.play()
        })
    }
    /**
     * 替换常见的短语为汉字, 让弹幕娘别那么傻
     * @param {string} text 
     */
    replace (text) {
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
/** @type {string} */
let roomid = Param.get('roomid')
let helper = new BilibiliDanmakuHelper(roomid)
window.helper = helper
