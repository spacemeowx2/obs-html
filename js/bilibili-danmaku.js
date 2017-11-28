function onDanmu (danmu) {
    console.log('onDanmu', danmu)
}
function onMessage (payload) {
    try {
        let data = JSON.parse(payload)
        switch (data.cmd) {
            case 'DANMU_MSG':
                let p = data.info
                let danmu = {
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
                }
                onDanmu(danmu)
                break
            default:
                console.log('ignore unknown cmd: ', data.cmd)
        }
    } catch (e) {
        console.error(e)
    }
}
let danmu = new BilibiliDanmaku(98631)
danmu.onMessage = (pkg) => {
    switch (pkg.op) {
        case 5:
            onMessage(pkg.payload)
            break
    }
}