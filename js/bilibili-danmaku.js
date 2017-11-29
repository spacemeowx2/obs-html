function onDanmu (danmu) {
    console.log('onDanmu', danmu)
    addLine(`${danmu.lb}: ${danmu.text}`)
    if (tts.length < 3) {
        tts.addQueue(`${danmu.lb}说 ${danmu.text}`)
    }
}
function onMessage (payload) {
    try {
        let data = JSON.parse(payload)
        switch (data.cmd) {
            case 'DANMU_MSG':
                let p = data.info
                let danmu = {
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
                onDanmu(danmu)
                break
            default:
                console.log('ignore unknown cmd: ', data.cmd)
        }
    } catch (e) {
        console.error(e)
    }
}
function addLine (text) {
    const list = document.getElementById('list')
    const danmaku = document.getElementById('danmaku')
    const li = document.createElement('li')
    li.innerText = text
    list.appendChild(li)
    if (list.children.length > 50) {
        list.children[0].remove()
    }
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
        const url = `http://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&spd=7&text=${encodeURIComponent(text)}`
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
}
let tts = new TTS(200, 0.5)
let danmu = new BilibiliDanmaku(Param.get('roomid'))
addLine('Bilibili 弹幕助手 启动!')
tts.addQueue('Bilibili 弹幕助手 启动!')
danmu.onMessage = (pkg) => {
    switch (pkg.op) {
        case 5:
            onMessage(pkg.payload)
            break
    }
}
function delay (time) {
    return new Promise((res) => {
        setTimeout(res, time)
    })
}
async function test () {
    for (let i = 0; i < 50; i++) {
        addLine('啊' + i.toString())
        await delay(1000)
    }
}
