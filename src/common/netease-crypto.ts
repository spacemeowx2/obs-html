import { AES, ModeOfOperation, utils, padding } from 'aes-js'
import { BigNumber } from 'bignumber.js/bignumber'
const modulus = '00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7'
const pubKey = '010001'
const nonce: Uint8Array = utils.utf8.toBytes('0CoJUm6Qyw8W8jud')
const iv: Uint8Array = utils.utf8.toBytes('0102030405060708')

function uin8ToBase64 (u8: Uint8Array) {
    let s = ''
    for (let i of u8) {
        s += String.fromCharCode(i)
    }
    return btoa(s)
}

function aesEncrypt(text: string | Uint8Array, secKey: Uint8Array) {
    const cipher = new ModeOfOperation.cbc(secKey, iv)
    if (typeof text === 'string') {
        text = utils.utf8.toBytes(text)
    }
    text = padding.pkcs7.pad(text)
    return uin8ToBase64(cipher.encrypt(text))
}

function createSecretKey(size: number) {
    let keys = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let key = ''
    for (let i = 0; i < size; i++) {
        let pos = Math.random() * keys.length
        pos = Math.floor(pos)
        key = key + keys.charAt(pos)
    }
    return key
}

function addPadding(encText: string, modulus: string) {
    let ml = modulus.length
    for (let i = 0; ml > 0 && modulus[i] == '0'; i++) ml--
    let num = ml - encText.length
    let prefix = ''
    for (let i = 0; i < num; i++) {
        prefix += '0'
    }
    return prefix + encText
}

function rsaEncrypt(text: string, exponent: string, modulus: string) {
    let rText: number[] = []
    const radix = 16
    for (let i of text) {
        rText.push(i.charCodeAt(0))
    }
    rText = rText.reverse() // reverse text
    let biText = new BigNumber(utils.hex.fromBytes(rText), radix)
    let biEx = new BigNumber(exponent, radix)
    let biMod = new BigNumber(modulus, radix)
    let biRet = biText.pow(biEx.toNumber(), biMod)
    return addPadding(biRet.toString(radix), modulus)
}
  

export function aesRsaEncrypt (text: string) {
    let secKey = createSecretKey(16)
    return {
      params: aesEncrypt(aesEncrypt(text, nonce), utils.utf8.toBytes(secKey)),
      encSecKey: rsaEncrypt(secKey, pubKey, modulus),
    }
}
