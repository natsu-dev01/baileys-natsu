import makeWASocket from 'baileys-natsu'
import { useMultiFileAuthState } from 'baileys-natsu'
import { downloadMediaMessage } from 'baileys-natsu'
import { type WAMessage } from 'baileys-natsu'
import * as fs from 'node:fs/promises'

const start = async () => {
	const { state, saveCreds } = await useMultiFileAuthState('auth_info')

	const sock = makeWASocket({
		auth: state,
		printQRInTerminal: true,
	})

	sock.ev.on('creds.update', saveCreds)

	sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
		if (connection === 'open') {
			console.log('Conectado a WhatsApp')
		}

		if (connection === 'close') {
			console.log('Conexión cerrada')
		}
	})

	sock.ev.on('messages.upsert', async ({ messages, type }) => {
		if (type !== 'notify') return

		for (const msg of messages) {
			if (!msg.message || msg.key.fromMe) continue

			const jid = msg.key.remoteJid!
			const text =
				msg.message.conversation ||
				msg.message.extendedTextMessage?.text ||
				''

			if (text === '!ping') {
				await sock.sendMessage(jid, { text: 'pong!' })
			}

			if (text === '!hola') {
				await sock.sendMessage(jid, {
					text: 'Hola, soy un bot hecho con Baileys!',
				})
			}

			if (text.startsWith('!imagen')) {
				const buf = await fs.readFile('foto.jpg')
				await sock.sendMessage(jid, {
					image: buf,
					caption: 'Aquí tienes la imagen',
				})
			}

			if (text.startsWith('!video')) {
				const buf = await fs.readFile('video.mp4')
				await sock.sendMessage(jid, {
					video: buf,
					caption: 'Aquí tienes el video',
				})
			}

			if (text.startsWith('!audio')) {
				const buf = await fs.readFile('audio.mp3')
				await sock.sendMessage(jid, {
					audio: buf,
					mimetype: 'audio/mp4',
					ptt: true,
				})
			}

			if (text.startsWith('!react')) {
				await sock.sendMessage(jid, {
					react: { key: msg.key, text: '👍' },
				})
			}

			if (text.startsWith('!editar')) {
				await sock.sendMessage(jid, {
					text: 'Mensaje editado!',
					edit: msg.key,
				})
			}

			if (text.startsWith('!borrar')) {
				await sock.sendMessage(jid, { delete: msg.key })
			}

			if (text.startsWith('!descargar')) {
				const buffer = await downloadMediaMessage(
					msg,
					'buffer',
					{},
				)
				await fs.writeFile('descargado.bin', buffer)
				await sock.sendMessage(jid, {
					text: 'Archivo descargado!',
				})
			}

			if (text.startsWith('!grupo')) {
				const group = await sock.groupCreate(
					'Mi Grupo',
					['521234567890@s.whatsapp.net'],
				)
				await sock.sendMessage(jid, {
					text: `Grupo creado: ${group.id}`,
				})
			}
		}
	})

	sock.ev.on('presence.update', ({ id, presences }) => {
		for (const [participant, data] of Object.entries(presences)) {
			console.log(`${participant}: ${data.lastKnownPresence}`)
		}
	})
}

start().catch(console.error)
