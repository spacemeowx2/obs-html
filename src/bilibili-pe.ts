import { Param } from './common/param'
import { delay, Task } from './common/utils'
import { BilibiliDanmaku, GiftInfo, DanmuInfo } from './common/bilibili-danmaku'
import { World, Render, Engine, Bodies, Body, IBodyRenderOptions } from 'matter-js'
import axios from 'axios'

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
    window.pe.handleGift({giftId: 1})
    debug('click')
}
class BilibiliPE {
    engine = Engine.create()
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
    ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true })
    constructor () {
        const { engine, render, ground } = this
        const boxA = Bodies.rectangle(400, 200, 80, 80)
        const boxB = Bodies.rectangle(450, 50, 80, 80)
        World.add(engine.world, [boxA, boxB, ground])
        Engine.run(engine)
        Render.run(render)
        window.addEventListener('resize', () => this.resize())
    }
    private resize() {
        const canvas = this.render.canvas
        const { innerWidth, innerHeight } = window
       
        canvas.width  = innerWidth
        canvas.height = innerHeight
    }
    private get width() {
        return this.canvas.width
    }
    private get height() {
        return this.canvas.height
    }
    handleDanmu (danmu: DanmuInfo) {
        console.log('danmu', danmu)
    }
    handleGift (gift: GiftInfo) {
        console.log('gift', gift)
        const info = GiftMap.get(gift.giftId)
        let render: IBodyRenderOptions | undefined
        if (info) {
            render = {
                sprite: {
                    texture: info.img_dynamic,
                    xScale: 1,
                    yScale: 1
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
        let circle: Body
        if (render) {
            circle = Bodies.circle(this.width - 15, 30, 20, {
                render
            })
        } else {
            circle = Bodies.circle(this.width - 15, 30, 20, {
                render
            })
        }
        Body.setVelocity(circle, { x: -10, y: 0 })
        World.add(this.engine.world, circle)
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
