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

			// --- New message types ---

			if (text === '!album') {
				const img1 = await fs.readFile('foto1.jpg')
				const img2 = await fs.readFile('foto2.jpg')
				await sock.sendMessage(jid, {
					albumMessage: [
						{ image: img1, caption: 'Foto primera' },
						{ image: img2, caption: 'Foto segunda' },
					],
				})
			}

			if (text === '!album_video') {
				const img = await fs.readFile('foto.jpg')
				const vid = await fs.readFile('video.mp4')
				await sock.sendMessage(jid, {
					albumMessage: [
						{ image: img, caption: 'Imagen' },
						{ video: vid, caption: 'Video' },
					],
				})
			}

			if (text === '!pollresult') {
				await sock.sendMessage(jid, {
					pollResultMessage: {
						name: 'Hello World',
						pollVotes: [
							{ optionName: 'TEST 1', optionVoteCount: '112233' },
							{ optionName: 'TEST 2', optionVoteCount: '1' },
						],
					},
				})
			}

			if (text === '!interactive') {
				await sock.sendMessage(jid, {
					interactiveMessage: {
						header: 'Hello World',
						body: 'This is the body text',
						footer: 'Your footer here',
						buttons: [
							{
								name: 'cta_copy',
								buttonParamsJson: JSON.stringify({
									display_text: 'Copy Code',
									id: '123456789',
									copy_code: 'ABC123XYZ',
								}),
							},
						],
					},
				})
			}

			if (text === '!interactive_flow') {
				await sock.sendMessage(jid, {
					interactiveMessage: {
						header: 'Hello World',
						body: 'Select an option below',
						footer: 'Your footer here',
						image: { url: 'https://example.com/image.jpg' },
						nativeFlowMessage: {
							messageParamsJson: JSON.stringify({
								limited_time_offer: {
									text: 'Limited offer',
									url: 'https://example.com/offer',
									copy_code: 'OFFER2024',
									expiration_time: Date.now() * 999,
								},
							}),
							buttons: [
								{
									name: 'single_select',
									buttonParamsJson: JSON.stringify({
										title: 'Options',
										sections: [
											{
												title: 'Section 1',
												highlight_label: 'Popular',
												rows: [
													{
														title: 'Option 1',
														description: 'Description here',
														id: 'row_1',
													},
												],
											},
										],
										has_multiple_buttons: true,
									}),
								},
							],
						},
					},
				})
			}

			if (text === '!product') {
				await sock.sendMessage(jid, {
					productMessage: {
						title: 'Sample Product',
						description: 'This is a product description',
						thumbnail: { url: 'https://example.com/image.jpg' },
						productId: 'PROD001',
						retailerId: 'RETAIL001',
						url: 'https://example.com/product',
						body: 'Product details',
						footer: 'Special price',
						priceAmount1000: 50000,
						currencyCode: 'USD',
						businessOwnerJid: jid,
						buttons: [
							{
								name: 'cta_url',
								buttonParamsJson: JSON.stringify({
									display_text: 'Buy Now',
									url: 'https://example.com/buy',
								}),
							},
						],
					},
				})
			}

			if (text === '!interactive_doc') {
				const doc = await fs.readFile('./package.json')
				const thumb = await fs.readFile('./document.jpeg')
				await sock.sendMessage(jid, {
					interactiveMessage: {
						header: 'Hello World',
						body: 'Document attached',
						footer: 'Your footer here',
						document: doc,
						mimetype: 'application/pdf',
						fileName: 'document.pdf',
						jpegThumbnail: thumb,
						contextInfo: {
							mentionedJid: [jid],
							forwardingScore: 777,
							isForwarded: false,
						},
						externalAdReply: {
							title: 'My Bot',
							body: 'Check this out',
							mediaType: 3,
							thumbnailUrl: 'https://example.com/image.jpg',
							mediaUrl: 'https://example.com',
							sourceUrl: 'https://example.com',
							showAdAttribution: true,
							renderLargerThumbnail: false,
						},
						buttons: [
							{
								name: 'cta_url',
								buttonParamsJson: JSON.stringify({
									display_text: 'Visit Site',
									url: 'https://example.com',
									merchant_url: 'https://example.com',
								}),
							},
						],
					},
				})
			}

			if (text === '!payment') {
				const quotedType = msg?.mtype || ''
				const quotedContent = JSON.stringify({ [quotedType]: msg }, null, 2)
				await sock.sendMessage(jid, {
					requestPaymentMessage: {
						currencyCodeIso4217: 'IDR',
						amount1000: 10000000,
						requestFrom: msg.key.participant || msg.key.remoteJid!,
						noteMessage: JSON.parse(quotedContent),
						background: {
							id: '100',
							fileLength: '0',
							width: 1000,
							height: 1000,
							mimetype: 'image/webp',
							placeholderArgb: 0xFF00FFFF,
							textArgb: 0xFFFFFFFF,
							subtextArgb: 0xFFAA00FF,
						},
					},
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
