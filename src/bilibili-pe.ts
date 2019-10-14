import { Param } from './common/param'
import { delay, Task } from './common/utils'
import { BilibiliDanmaku, GiftInfo, DanmuInfo } from './common/bilibili-danmaku'
import { World, Render, Engine, Bodies, Body, IBodyRenderOptions, Composites } from 'matter-js'
import axios from 'axios'

const MaxWidth = 5000
const MaxHeight = 5000

interface BilibiliGift {
    id: number
    name: string
    price: number
    img_dynamic: string
}

interface BilibiliGiftResp {
    data: BilibiliGift[]
}

const GiftMap = new Map<number, BilibiliGift>()

function debug (d: string) {
    document.getElementById('debug')!.innerText += d + '\n'
}
function debugClick () {
    // @ts-ignore
    // window.pe.handleGift({giftId: 1, count: 100})
    // @ts-ignore
    window.pe.handleDanmu({text: 'test'})
}
class BilibiliPE {
    engine = Engine.create({
        enableSleeping: true
    })
    render = Render.create({
        canvas: document.getElementById('canvas') as HTMLCanvasElement,
        engine: this.engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight,
            // @ts-ignore
            background: 'transparent',
            // @ts-ignore
            wireframeBackground: 'transparent',
            wireframes: false
        }
    })
    canvas = this.render.canvas
    ground = Bodies.rectangle(400, 610, MaxWidth, 60, { isStatic: true })
    bodies: Body[] = []
    giftQueue: IBodyRenderOptions[] = []
    danmuQueue: {text: string}[] = []
    constructor () {
        const { engine, render, ground } = this
        World.add(engine.world, [ground])
        Engine.run(engine)
        Render.run(render)
        this.resize()
        window.addEventListener('resize', () => this.resize())
        setInterval(() => {
            for (let b of this.bodies) {
                const { isSleeping, position: { x, y } } = b
                if (isSleeping) {
                    World.remove(engine.world, b)
                }
                if (x < -100 || x > (MaxWidth + 100) || y < -100 || y > (MaxHeight + 100)) {
                    World.remove(engine.world, b)
                }
            }
        }, 5000)
        setInterval(() => {
            const r = this.giftQueue.shift()
            if (r) {
                this.fireGift(r)
            }
        }, 100)
        setInterval(() => {
            const d = this.danmuQueue[0]
            if (d) {
                if (d.text.length === 0) {
                    this.danmuQueue.shift()
                    return
                }
                const c = d.text[0]
                d.text = d.text.slice(1)

                this.fireChar(c)
            }
        }, 100)
    }
    private resize() {
        const canvas = this.render.canvas
        let { innerWidth, innerHeight } = window

        innerWidth = Math.min(MaxWidth, innerWidth)
        innerHeight = Math.min(MaxHeight, innerHeight)

        canvas.width  = innerWidth
        canvas.height = innerHeight

        Body.setPosition(this.ground, { x: 0, y: innerHeight + 30 })
    }
    private get width() {
        return this.canvas.width
    }
    private get height() {
        return this.canvas.height
    }
    private renderChar (t: string) {
        const size = 40
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            return
        }
        ctx.font = '32px 微软雅黑'
        ctx.strokeStyle = '#000000'
        ctx.fillStyle = '#FFFFFF'
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        ctx.fillText(t, size / 2, size / 2)
        ctx.strokeText(t, size / 2, size / 2)
        return canvas.toDataURL()
    }
    private fireChar (char: string) {
        const url = this.renderChar(char)
        if (url) {
            const r = 25
            const circle = Bodies.circle(this.width - r / 2, 30, r, {
                render: {
                    sprite: {
                        texture: url,
                        xScale: 1,
                        yScale: 1
                    }
                }
            })
            Body.setVelocity(circle, { x: -10, y: 0 })
            Body.setAngularVelocity(circle, -0.05 + 0.1 * Math.random())
            World.add(this.engine.world, circle)
            this.bodies.push(circle)
        }
    }
    private fireGift (render: IBodyRenderOptions, imgR = 140) {
        const r = 25
        const circle = Bodies.circle(this.width - r / 2, 30, r, {
            render
        })
        render.sprite!.xScale = ((r*2) / imgR)
        render.sprite!.yScale = ((r*2) / imgR)
        Body.setVelocity(circle, { x: -(10 + Math.random() * 5), y: (Math.random()) * 2 * 5 })
        Body.setAngularVelocity(circle, -0.05 + 0.1 * Math.random())
        World.add(this.engine.world, circle)
        this.bodies.push(circle)
    }
    handleDanmu (danmu: DanmuInfo) {
        console.log('danmu', danmu)
        this.danmuQueue.push({ text: danmu.text })
    }
    handleGift (gift: GiftInfo) {
        console.log('gift', gift)
        const info = GiftMap.get(gift.giftId)
        let render: IBodyRenderOptions | undefined
        if (info) {
            render = {
                sprite: {
                    texture: info.img_dynamic,
                    xScale: 40 / 140,
                    yScale: 40 / 140
                }
            }
        } else {
            render = {
                sprite: {
                    texture: 'https://i0.hdslb.com/bfs/live/d57afb7c5596359970eb430655c6aef501a268ab.png',
                    xScale: 40 / 140,
                    yScale: 40 / 140
                }
            }
            console.error('gift not found', gift)
        }
        for (let i = 0; i < gift.count; i++) {
            this.giftQueue.push(render)
        }
    }
}
async function bilibiliPE () {
    let roomid = Param.get('roomid', '')
    try {
        const r = await axios.get<BilibiliGiftResp>('https://api.live.bilibili.com/gift/v3/live/gift_config')
        for (const g of r.data.data) {
            GiftMap.set(g.id, g)
        }
    } catch (e) {
        debug('failed to get bilibili gift info')
    }
    if (roomid) {
        const danmu = new BilibiliDanmaku(roomid)
        const pe = new BilibiliPE()
        danmu.onDanmu = (danmu) => pe.handleDanmu(danmu)
        danmu.onGift = (gift) => pe.handleGift(gift)
        // @ts-ignore
        window.pe = pe
        window.addEventListener('click', debugClick)
    }
}
bilibiliPE()
