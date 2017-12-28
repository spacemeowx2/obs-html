import axios from 'axios'
import { AxiosInstance } from 'axios'
import { aesRsaEncrypt } from './netease-crypto'
import { MusicProvider, Music, MusicError } from './music-interface'
const NETEASE_API_URL = 'http://music.163.com/weapi'
const enum NMResCode {
    OK = 200
}
interface NMResponseCode {
    code: NMResCode
}
type NMResponse<T> = NMResponseCode & T
interface NMPlaylist {
    id: number
    name: string
    description: string
    tags: string[]
    tracks: NMShortSong[]
}
interface NMPlaylistDetail {
    playlist: NMPlaylist
}
interface NMAlumn {
    id: number
    name: string
    picUrl: string
}
interface NMAuthor {
    id: number
    name: string
}
interface NMShortSource {
    br: number
    fid: number
    size: number
    vd: number
}
interface NMSource {
    bitrate: number
    id: number
    size: number
    volumeDelta: number
}
interface NMSong { //mdzz
    name: string
    id: number
    artists: NMAuthor[]
    album: NMAlumn
    duration: number
    hMusic?: NMSource
    mMusic?: NMSource
    lMusic?: NMSource
    url?: string
}
interface NMShortSong {
    name: string
    id: number
    ar: NMAuthor[]
    al: NMAlumn
    dt: number
    h?: NMShortSource
    m?: NMShortSource
    l?: NMShortSource
}
function shortSource2Source (ss: NMShortSource | undefined) {
    if (!ss) return
    let src: NMSource = {
        bitrate: ss.br,
        id: ss.fid,
        size: ss.size,
        volumeDelta: ss.vd
    }
    return src
}
function shortSong2Song (ss: NMShortSong) {
    let song: NMSong = {
        name: ss.name,
        id: ss.id,
        artists: ss.ar,
        album: ss.al,
        duration: ss.dt,
        hMusic: shortSource2Source(ss.h),
        mMusic: shortSource2Source(ss.m),
        lMusic: shortSource2Source(ss.l),
    }
    return song
}
interface NMSongDetailResult {
    songs: NMSong[]
}
interface NMSearchResult {
    result: {
        songs: NMShortSong[]
        songCount: number
    }
}
interface NMURLResult {
    data: {
        url: string
        br: number
        size: number
    }[]
}
export class NeteaseMusicAPI implements MusicProvider {
    name = '网易云音乐'
    axios: AxiosInstance
    musicNM = new WeakMap<Music,  NMSong>()
    constructor (proxy = 'https://0579dc8a-8835-4932-9253-e2143ec07833.coding.io/proxy.php') {
        this.axios = axios.create()
        this.axios.interceptors.request.use((config) => {
            if (config.url && config.url.match(/^https?:/)) {
                const overrideHeaders = {
                    'Origin': 'http://music.163.com',
                    'Referer': 'http://music.163.com',
                    'User-Agent': randomUserAgent(),
                    'X-Real-IP': randomChinaIpAddress(),
                    'Connection': 'keep-alive',
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
                config.headers['X-PROXY-HEADER'] = this.headers2ProxyHeader(overrideHeaders)
                config.headers['X-PROXY-URL'] = config.url
                config.url = proxy
            }
            return config
        })
    }
    headers2ProxyHeader (hs: any) {
        return JSON.stringify(Object.keys(hs).map(k => `${k}: ${hs[k]}`))
    }
    request<T> (api: string, data: any) {
        let qs = Object.keys(data).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(data[k])}`).join('&')
        return this.axios.post<T>(NETEASE_API_URL + api, qs)
    }
    shortSong2Music (song: NMShortSong): Music {
        let ret: Music = new Music({
            name: song.name,
            author: song.ar.map(a => a.name).join('/'),
            duration: song.dt / 1000,
            provider: this
        })
        this.musicNM.set(ret, shortSong2Song(song))
        return ret
    }
    song2Music (song: NMSong): Music {
        let ret: Music = new Music({
            name: song.name,
            author: song.artists.map(a => a.name).join('/'),
            duration: song.duration / 1000,
            provider: this
        })
        this.musicNM.set(ret, song)
        return ret
    }
    async getPlaylist (id: string): Promise<Music[]> {
        const obj = {
            id,
            n: 1000,
            csrf_token: ''
        }
        const encData = aesRsaEncrypt(JSON.stringify(obj))
        const res = await this.request<NMResponse<NMPlaylistDetail>>(`/v3/playlist/detail`, encData)
        const data = res.data
        let ret: Music[] = []
        for (let song of data.playlist.tracks) {
            ret.push(this.shortSong2Music(song))
        }
        return ret
    }
    async search (key: string): Promise<Music> {
        const limit = 30
        const page = 1
        const obj = {
            s: key,
            type: 1,
            limit: 30,
            offset: (page - 1) * limit,
        }
        const encData = aesRsaEncrypt(JSON.stringify(obj))
        const res = await this.request<NMResponse<NMSearchResult>>('/cloudsearch/get/web?csrf_token=', encData)
        const data = res.data
        if (data.code !== NMResCode.OK) {
            throw new MusicError('搜索失败')
        }
        let ret: Music[] = []
        for (let song of data.result.songs) {
            ret.push(this.shortSong2Music(song))
        }
        for (let m of ret) {
            try {
                const url = await this.getMusicURL(m)
                if (/^https?:\/\//.test(url)) {
                    return m
                }
            } catch (e) {
                console.error('无效的搜索结果', m.name, m.author, e)
            }
        }
        throw new MusicError('无可播放的歌')
    }
    async getMusicURL (music: Music): Promise<string> {
        const song = this.musicNM.get(music)
        if (!song) {
            throw new Error('获取歌曲地址失败')
        }
        if (song.url) {
            return song.url
        }
        let br: number | undefined
        if (song.mMusic) {
            br = song.mMusic.bitrate
        }
        const url = await this.getMusicURLById(song.id, br)
        song.url = url
        return url
    }
    async getMusicById (id: number): Promise<Music> {
        const res = await this.axios.get<NMResponse<NMSongDetailResult>>(`http://music.163.com/api/song/detail/?ids=${encodeURIComponent(JSON.stringify([id]))}`)
        const data = res.data
        if (data.code !== NMResCode.OK) throw new Error('获取歌曲详情时失败')
        if (data.songs.length > 0) {
            return this.song2Music(data.songs[0])
        } else {
            throw new Error('获取歌曲详情个数为0')
        }
    }
    async getMusicURLById (id: number, br?: number) {
        const obj = {
            ids: [id],
            br: br || 999000,
            csrf_token: '',
        }
        const encData = aesRsaEncrypt(JSON.stringify(obj))
        const res = await this.request<NMResponse<NMURLResult>>('/song/enhance/player/url', encData)
        const data = res.data.data
        if (res.data.code !== NMResCode.OK || data.length === 0) {
            throw new MusicError('获取歌曲地址失败')
        }
        if (!data[0].url) {
            throw new MusicError('歌曲可能已下架')
        }
        return data[0].url
    }
}

function randomUserAgent () {
  const userAgentList = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
    'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_2 like Mac OS X) AppleWebKit/603.2.4 (KHTML, like Gecko) Mobile/14F89;GameHelper',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/603.2.4 (KHTML, like Gecko) Version/10.1.1 Safari/603.2.4',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A300 Safari/602.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:46.0) Gecko/20100101 Firefox/46.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:46.0) Gecko/20100101 Firefox/46.0',
    'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)',
    'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
    'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Win64; x64; Trident/6.0)',
    'Mozilla/5.0 (Windows NT 6.3; Win64, x64; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/13.10586',
    'Mozilla/5.0 (iPad; CPU OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A300 Safari/602.1',
  ]
  const num = Math.floor(Math.random() * userAgentList.length)
  return userAgentList[num]
}
function randomChinaIpAddress() {
    return `211.161.244.${Math.floor(254 * Math.random())}`
}
