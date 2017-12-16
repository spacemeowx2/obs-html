export class MusicError extends Error {
}
export interface Music {
    name: string
    author: string
    duration?: number // in sec, to filter out the long music
    provider: MusicProvider
    toString (): string
}
export interface MusicProvider {
    search (key: string): Promise<Music[]>
    getMusicURL (music: Music): Promise<string>
}
export interface MusicListener {
    onProcess (music: Music, pos: number, end: number): void
}
