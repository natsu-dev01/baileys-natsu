import makeWASocket from 'baileys-natsu'

const sock = makeWASocket({
    printQRInTerminal: false
})

if (!sock.authState.creds.registered) {
    const number = '51928616320'
    const code = await sock.requestPairingCode(number)
    console.log(code)
}
