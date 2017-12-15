declare module 'aes-js' {
    type Bytes = Uint8Array | number[]
    interface convertHex {
        toBytes (text: string): number[]
        fromBytes (bytes: Bytes): string
    }
    interface convertUtf8 {
        toBytes (text: string): Uint8Array
        fromBytes (bytes: Bytes): string
    }
    export class Counter {
        constructor (initialValue: number)
        setValue (value: number): void
        setBytes (bytes: Bytes): void
        increment (): void
    }
    export class AES {
        constructor (key: Bytes)
        encrypt (plaintext: Bytes): Uint8Array
        decrypt (ciphertext: Bytes): Uint8Array
    }
    class ModeOfOperationECB extends AES {
    }
    class ModeOfOperationCBC extends AES {
        constructor (key: Bytes, iv: Bytes)
    }
    class ModeOfOperationCFB extends AES {
        constructor (key: Bytes, iv: Bytes, segmentSize?: number)
    }
    class ModeOfOperationOFB extends AES {
        constructor (key: Bytes, iv: Bytes)
    }
    class ModeOfOperationCTR extends AES {
        constructor (key: Bytes, counter?: Counter)
    }
    export const ModeOfOperation: {
        ecb: typeof ModeOfOperationECB,
        cbc: typeof ModeOfOperationCBC,
        cfb: typeof ModeOfOperationCFB,
        ofb: typeof ModeOfOperationOFB,
        ctr: typeof ModeOfOperationCTR
    }
    export const utils: {
        hex: convertHex
        utf8: convertUtf8
    }
    export const padding: {
        pkcs7: {
            pad (data: Bytes): Uint8Array,
            strip (data: Bytes): Uint8Array
        }
    }
}
