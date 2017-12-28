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
        },
        'stayTime': {
            default: 10
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
    danmakuKey (danmaku: Danmaku): string {
        return danmaku.id!.toString()
    }
    addLine (text: string) {
        this.addDanmaku({
            content: text
        })
    }
    addDanmaku (danmu: Danmaku) {
        this.list.push({
            ...danmu,
            id: this.nextId++
        })
        this.checkListLimit()
    }
    checkListLimit () {
        const more = 5
        if (this.list.length > this.listLimit + more) {
            this.list.splice(0, more)
        }
    }
}
