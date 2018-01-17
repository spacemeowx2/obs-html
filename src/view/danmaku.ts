import Vue from 'vue'
import Component from 'vue-class-component'

interface DanmakuSender {
    name: string
    avatar?: string
}
interface Danmaku {
    sender?: DanmakuSender
    content: string
    id?: number
}
@Component({
    name: 'danmaku',
    template: '#danmaku-template',
    props: ['sender', 'content']
})
class DanmakuComponent extends Vue {
}

@Component({
    name: 'danmaku-list',
    template: '#danmaku-list-template',
    props: {
        'avatar': {
            default: false
        }
    },
    components: {
        'danmaku': DanmakuComponent
    }
})
export class DanmakuListComponent extends Vue {
    listLimit = 50
    list: Danmaku[] = []
    nextId = 1
    stayTime = 60
    danmakuKey (danmaku: Danmaku): string {
        return danmaku.id!.toString()
    }
    addLine (text: string, persist = false) {
        this.addDanmaku({
            content: text
        }, persist)
    }
    addDanmaku (danmu: Danmaku, persist = false) {
        const item = {
            ...danmu,
            id: this.nextId++
        }
        this.list.push(item)
        if (!persist) {
            setTimeout(() => {
                const id = this.list.indexOf(item)
                if (id !== -1) {
                    this.list.splice(id, 1)
                }
            }, this.stayTime * 1000)
        }
        this.checkListLimit()
    }
    checkListLimit () {
        const more = 5
        if (this.list.length > this.listLimit + more) {
            this.list.splice(0, more)
        }
    }
}
