export class MusicError extends Error {
}
export class Music {
    name: string
    author: string
    duration?: number // in sec, to filter out the long music
    provider: MusicProvider
    constructor (music?: Music) {
        if (music) {
            this.name = music.name
            this.author = music.author
            this.duration = music.duration
            this.provider = music.provider
        }
    }
    toString (): string {
        return `${this.name} - ${this.author}`
    }
}
export interface MusicProvider {
    name: string
    search (key: string): Promise<Music>
    getMusicById (id: number): Promise<Music>
    getMusicURL (music: Music): Promise<string>
}
export interface MusicListener<T> {
    onProcess (music: Music, currentTime: number, durationTime: number): void
    onListUpdate (list: T[]): void
    onError (e: any): void
}
