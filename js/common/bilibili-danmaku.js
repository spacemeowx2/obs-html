define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const FIELD_HEADER_LEN = 0;
    const FIELD_PROTO_VER = 1;
    const FIELD_OP = 2;
    const FIELD_SEQ_ID = 3;
    const OP_HEARTBEAT = 2;
    const OP_HANDSHAKE = 7;
    class BilibiliDanmaku {
        constructor(roomid) {
            this.onMessage = null;
            this.onDanmu = null;
            this.onGift = null;
            this._buf = new ArrayBuffer(0);
            this.roomid = parseInt(roomid);
            this.headerLen = 16;
            this.hbInterval = 30;
            this.fields = [{
                    name: "Header Length",
                    key: "headerLen",
                    bytes: 2,
                    offset: 4,
                    value: 16
                }, {
                    name: "Protocol Version",
                    key: "ver",
                    bytes: 2,
                    offset: 6,
                    value: 1
                }, {
                    name: "Operation",
                    key: "op",
                    bytes: 4,
                    offset: 8,
                    value: -1
                }, {
                    name: "Sequence Id",
                    key: "seq",
                    bytes: 4,
                    offset: 12,
                    value: 0
                }];
            this._hbid = null;
            this.stop = false;
            this.connect();
        }
        reconnect() {
            if (!this.stop) {
                this.reset();
                setTimeout(() => this.connect(), 2000); // retry
            }
        }
        reset() {
            this.fields[FIELD_SEQ_ID].value = 0;
            if (this.w) {
                this.w.onopen = this.w.onmessage = this.w.onclose = this.w.onerror = () => null;
                this.w = undefined;
            }
            if (this._hbid) {
                clearTimeout(this._hbid);
                this._hbid = null;
            }
        }
        connect() {
            this.reset();
            let w = new WebSocket('wss://broadcastlv.chat.bilibili.com:2245/sub');
            this.w = w;
            w.binaryType = "arraybuffer";
            w.onopen = () => this._onopen();
            w.onmessage = (e) => this._onmessage(e.data);
            w.onclose = () => this._onclose();
            w.onerror = (e) => this._onerror();
        }
        handshake() {
            this._send({
                uid: 0,
                protover: 1,
                roomid: this.roomid
            }, OP_HANDSHAKE);
            console.log('handshake sent');
        }
        _heartbeat() {
            if (!this.stop) {
                if (this._hbid) {
                    clearTimeout(this._hbid);
                    this._hbid = null;
                }
                this._send(null, OP_HEARTBEAT);
                this._hbid = setTimeout(() => this._heartbeat(), 1000 * this.hbInterval);
            }
        }
        _send(payload, op) {
            if (!this.w) {
                throw new Error('websocket not init');
            }
            let encoder = new TextEncoder();
            let header = new ArrayBuffer(this.headerLen);
            let view = new DataView(header);
            let dataStr = '';
            if (payload) {
                try {
                    dataStr = JSON.stringify(payload);
                }
                catch (e) { }
            }
            else {
                dataStr = '';
            }
            let data = encoder.encode(dataStr);
            view.setInt32(0, data.byteLength + this.headerLen);
            this.fields[FIELD_OP].value = op;
            this.fields[FIELD_SEQ_ID].value++;
            for (let field of this.fields) {
                if (field.bytes === 4) {
                    view.setInt32(field.offset, field.value);
                }
                else if (field.bytes === 2) {
                    view.setInt16(field.offset, field.value);
                }
            }
            let out = this._concatAB(header, data.buffer);
            this.w.send(out);
        }
        _concatAB(a, b) {
            let a8 = new Uint8Array(a);
            let b8 = new Uint8Array(b);
            let out = new Uint8Array(a8.byteLength + b8.byteLength);
            out.set(a8, 0);
            out.set(b8, a8.byteLength);
            return out.buffer;
        }
        _onopen() {
            this.handshake();
        }
        _onmessage(data) {
            while (1) {
                const buf = this._concatAB(this._buf, data);
                const rest = this._onPkg(buf);
                this._buf = rest;
                if (rest.byteLength === 0) {
                    break;
                }
            }
        }
        _onPkg(pkgData) {
            const view = new DataView(pkgData);
            const pkgLen = view.getInt32(0);
            let pkg = {
                op: -1,
                headerLen: -1,
                payload: '',
                pkgLen
            };
            for (let field of this.fields) {
                view.getInt32(field.offset);
                let value;
                if (field.bytes === 4) {
                    value = view.getInt32(field.offset);
                }
                else if (field.bytes === 2) {
                    value = view.getInt16(field.offset);
                }
                pkg[field.key] = value;
            }
            const decoder = new TextDecoder();
            const payload = pkgData.slice(pkg.headerLen, pkgLen);
            const restData = pkgData.slice(pkgLen);
            const payloadStr = decoder.decode(payload);
            pkg.payload = payloadStr;
            console.log('message', pkg);
            switch (pkg.op) {
                case 5:
                    this._onOP5(pkg.payload);
                    break;
                case 8:
                    this._hbid = setTimeout(() => this._heartbeat(), 1000 * this.hbInterval);
                    break;
            }
            this.onMessage && this.onMessage(pkg);
            return restData;
        }
        _onOP5(payload) {
            try {
                let data = JSON.parse(payload);
                switch (data.cmd) {
                    case 'DANMU_MSG':
                        let danmu = this.parseDanmu(data.info);
                        this.onDanmu && this.onDanmu(danmu);
                        break;
                    case 'SEND_GIFT':
                        let gift = this.parseGift(data.data);
                        this.onGift && this.onGift(gift);
                        break;
                    default:
                        console.log('ignore unknown cmd: ', data.cmd);
                }
            }
            catch (e) {
                console.error(e);
            }
        }
        _onclose() {
            console.log('close');
            this.reconnect();
        }
        _onerror() {
            console.log('error');
            this.reconnect();
        }
        parseDanmu(p) {
            return {
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
            };
        }
        parseGift(gift) {
            return {
                giftName: gift.giftName,
                sender: gift.uname,
                count: gift.num,
                senderAvatar: gift.face,
                giftId: gift.giftId
            };
        }
    }
    exports.BilibiliDanmaku = BilibiliDanmaku;
});
