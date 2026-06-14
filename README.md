<h1 align="center">baileys-natsu</h1>

<p align="center">
  Fork de <strong>@whiskeysockets/baileys</strong> — librería en TypeScript para interactuar con WhatsApp Web mediante WebSockets.
</p>

<p align="center">
  <a href="#instalacion">Instalacion</a> •
  <a href="#uso-basico">Uso Basico</a> •
  <a href="#enviar-mensajes">Enviar Mensajes</a> •
  <a href="#descargar-media">Descargar Media</a> •
  <a href="#grupos">Grupos</a> •
  <a href="#eventos">Eventos</a>
</p>

---

## Instalacion

```bash
npm install baileys-natsu
```

```bash
yarn add baileys-natsu
```

---

## Uso Basico

### Conexion con QR

```ts
import makeWASocket from 'baileys-natsu'
import { useMultiFileAuthState } from 'baileys-natsu'

const start = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection }) => {
    if (connection === 'open') console.log('Conectado!')
  })
}

start()
```

### Conexion con codigo de pairing

```ts
import makeWASocket from 'baileys-natsu'

const sock = makeWASocket({ printQRInTerminal: false })

if (!sock.authState.creds.registered) {
  const codigo = await sock.requestPairingCode('521234567890')
  console.log('Codigo de pairing:', codigo)
}
```

---

## Enviar Mensajes

```ts
import makeWASocket from 'baileys-natsu'

const sock = makeWASocket({ /* ... */ })
const jid = '521234567890@s.whatsapp.net'

// Texto
await sock.sendMessage(jid, { text: 'Hola mundo!' })

// Texto con cita (reply)
await sock.sendMessage(jid, { text: 'Respuesta' }, { quoted: msg.key })

// Imagen
await sock.sendMessage(jid, {
  image: Buffer.from('...'),
  caption: 'Foto',
})

// Video
await sock.sendMessage(jid, {
  video: Buffer.from('...'),
  caption: 'Video',
  seconds: 30,
})

// Video como nota (ptv)
await sock.sendMessage(jid, {
  video: Buffer.from('...'),
  ptv: true,
})

// Audio como nota de voz
await sock.sendMessage(jid, {
  audio: Buffer.from('...'),
  mimetype: 'audio/ogg; codecs=opus',
  ptt: true,
})

// Documento
await sock.sendMessage(jid, {
  document: Buffer.from('...'),
  fileName: 'archivo.pdf',
  mimetype: 'application/pdf',
})

// Sticker
await sock.sendMessage(jid, {
  sticker: Buffer.from('...'),
})

// Reaccion
await sock.sendMessage(jid, {
  react: { key: msg.key, text: '👍' },
})

// Editar mensaje
await sock.sendMessage(jid, {
  text: 'Texto nuevo',
  edit: msg.key,
})

// Eliminar mensaje
await sock.sendMessage(jid, { delete: msg.key })

// Ubicacion
await sock.sendMessage(jid, {
  location: { degreesLatitude: 19.43, degreesLongitude: -99.13 },
})

// Contacto
await sock.sendMessage(jid, {
  contacts: {
    displayName: 'Contacto',
    contacts: [{ vcard: 'BEGIN:VCARD\n...' }],
  },
})

// Encuesta
await sock.sendMessage(jid, {
  poll: {
    name: 'Color favorito?',
    values: ['Rojo', 'Azul', 'Verde'],
    selectableCount: 1,
  },
})
```

---

## Descargar Media

```ts
import { downloadMediaMessage } from 'baileys-natsu'

// Descargar a Buffer
const buffer = await downloadMediaMessage(msg, 'buffer', {})
await fs.writeFile('imagen.jpg', buffer)

// Descargar a Stream
const stream = await downloadMediaMessage(msg, 'stream', {})
stream.pipe(fs.createWriteStream('video.mp4'))
```

---

## Presencia (Typing)

```ts
// Online / Offline
await sock.sendPresenceUpdate('available')
await sock.sendPresenceUpdate('unavailable')

// Escribiendo
await sock.sendPresenceUpdate('composing', jid)

// Grabando audio
await sock.sendPresenceUpdate('recording', jid)

// Dejar de escribir
await sock.sendPresenceUpdate('paused', jid)
```

---

## Grupos

```ts
// Crear grupo
const group = await sock.groupCreate('Mi Grupo', [
  '5211111111111@s.whatsapp.net',
  '5222222222222@s.whatsapp.net',
])

// Obtener metadatos
const meta = await sock.groupMetadata(group.id)

// Cambiar nombre
await sock.groupUpdateSubject(group.id, 'Nuevo Nombre')

// Cambiar descripcion
await sock.groupUpdateDescription(group.id, 'Nueva descripcion')

// Agregar participantes
await sock.groupParticipantsUpdate(group.id, [
  '5233333333333@s.whatsapp.net',
], 'add')

// Eliminar participantes
await sock.groupParticipantsUpdate(group.id, [
  '5233333333333@s.whatsapp.net',
], 'remove')

// Promover/degollar admin
await sock.groupParticipantsUpdate(group.id, [
  '5233333333333@s.whatsapp.net',
], 'promote')
await sock.groupParticipantsUpdate(group.id, [
  '5233333333333@s.whatsapp.net',
], 'demote')

// Configurar grupo (solo admins pueden enviar)
await sock.groupSettingUpdate(group.id, 'announcement')
// Configurar grupo (todos pueden enviar)
await sock.groupSettingUpdate(group.id, 'not_announcement')

// Obtener codigo de invitacion
const code = await sock.groupInviteCode(group.id)

// Aceptar invitacion
const jid = await sock.groupAcceptInvite(code)

// Activar mensajes temporales (1 semana)
await sock.groupToggleEphemeral(group.id, 604800)

// Salir del grupo
await sock.groupLeave(group.id)
```

---

## Eventos

```ts
// Conexion
sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
  if (connection === 'open') console.log('Conectado')
  if (connection === 'close') console.log('Desconectado', lastDisconnect?.error)
})

// Mensajes entrantes
sock.ev.on('messages.upsert', ({ messages, type }) => {
  if (type === 'notify') {
    for (const msg of messages) {
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        ''
      console.log(`Mensaje de ${msg.key.remoteJid}: ${text}`)
    }
  }
})

// Actualizacion de mensajes (lectura, edicion)
sock.ev.on('messages.update', (updates) => {
  for (const { key, update } of updates) {
    console.log('Mensaje actualizado:', key.id)
  }
})

// Presencia de contactos
sock.ev.on('presence.update', ({ id, presences }) => {
  for (const [participant, data] of Object.entries(presences)) {
    console.log(`${participant}: ${data.lastKnownPresence}`)
  }
})

// Participantes de grupo
sock.ev.on('group-participants.update', ({ id, participants, action }) => {
  console.log(`Grupo ${id}: ${action} -> ${participants.join(', ')}`)
})

// Llamadas entrantes
sock.ev.on('call', (calls) => {
  for (const call of calls) {
    console.log(`Llamada de ${call.from}: ${call.status}`)
  }
})
```

---

## Chat Modificar

```ts
// Marcar como leido
await sock.readMessages([msg.key])

// Archivar chat
await sock.chatModify({ archive: true }, jid)

// Silenciar chat (por 8 horas)
await sock.chatModify({ mute: 8 * 60 * 60 * 1000 }, jid)

// Fijar chat
await sock.chatModify({ pin: true }, jid)
```

---

## Profile

```ts
// Obtener foto de perfil
const url = await sock.profilePictureUrl(jid, 'image')

// Cambiar nombre de perfil
await sock.updateProfileName('Mi Nombre')

// Cambiar estado
await sock.updateProfileStatus('Mi estado')

// Bloquear usuario
await sock.updateBlockStatus(jid, 'block')
// Desbloquear
await sock.updateBlockStatus(jid, 'unblock')
```

---

## Disclaimer

Este proyecto no esta afiliado, asociado, autorizado, respaldado ni conectado oficialmente con WhatsApp ni ninguna de sus subsidiarias o afiliadas.
El uso de esta libreria es bajo tu propia responsabilidad. No uses esta libreria para spam, mensajes automatizados masivos o cualquier otra actividad que viole los Terminos de Servicio de WhatsApp.

## License

MIT
