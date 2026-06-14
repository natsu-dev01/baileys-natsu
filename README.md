<h1 align="center">baileys-natsu</h1>

<p align="center">
  Fork de <strong>@whiskeysockets/baileys</strong> — librería en TypeScript para interactuar con WhatsApp Web mediante WebSockets.
</p>

<p align="center">
  <a href="#instalacion">Instalación</a> •
  <a href="#conectar-cuenta">Conectar Cuenta</a> •
  <a href="#enviar-mensajes">Enviar Mensajes</a> •
  <a href="#manipular-media">Manipular Media</a> •
  <a href="#grupos">Grupos</a> •
  <a href="#eventos">Eventos</a>
</p>

---

> [!CAUTION]
> Esta librería no está afiliada, asociada, autorizada, respaldada ni conectada oficialmente con WhatsApp. El uso es bajo tu propia responsabilidad. No uses esta librería para spam o actividades que violen los Términos de Servicio de WhatsApp.

## Instalación

```bash
npm install baileys-natsu
```

```bash
yarn add baileys-natsu
```

```ts
import makeWASocket, { useMultiFileAuthState, DisconnectReason, downloadMediaMessage } from 'baileys-natsu'
```

---

## Índice

- [Conectar Cuenta](#conectar-cuenta)
    - [Con QR](#conectar-con-qr)
    - [Con Pairing Code](#conectar-con-pairing-code)
    - [Recibir Historial Completo](#recibir-historial-completo)
- [Guardar Sesión](#guardar-sesión)
- [Eventos](#eventos)
    - [Ejemplo Completo](#ejemplo-completo)
- [Enviar Mensajes](#enviar-mensajes)
    - [Texto](#texto)
    - [Citar Mensaje](#citar-mensaje)
    - [Mencionar](#mencionar)
    - [Reacción](#reacción)
    - [Ubicación](#ubicación)
    - [Contacto](#contacto)
    - [Encuesta](#encuesta)
    - [Imagen](#imagen)
    - [Video](#video)
    - [Audio](#audio)
    - [Documento](#documento)
    - [Sticker](#sticker)
    - [ViewOnce](#viewonce)
    - [Editar Mensaje](#editar-mensaje)
    - [Eliminar Mensaje](#eliminar-mensaje)
    - [Reenviar](#reenviar)
- [Manipular Media](#manipular-media)
    - [Descargar Media](#descargar-media)
    - [Thumbnails](#thumbnails)
- [Presencia](#presencia)
- [Modificar Chats](#modificar-chats)
- [Grupos](#grupos)
- [Perfil](#perfil)
- [Privacidad](#privacidad)
- [Utilidades](#utilidades)

---

## Conectar Cuenta

WhatsApp Web permite autenticarse como segundo cliente escaneando un **código QR** o usando un **código de pairing**.

### Conectar con QR

```ts
import makeWASocket, { useMultiFileAuthState } from 'baileys-natsu'

async function start() {
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

### Conectar con Pairing Code

> [!IMPORTANT]
> El número debe ir sin `+`, `()`, `-`, solo dígitos con código de país.

```ts
import makeWASocket from 'baileys-natsu'

const sock = makeWASocket({ printQRInTerminal: false })

if (!sock.authState.creds.registered) {
  const codigo = await sock.requestPairingCode('521234567890')
  console.log('Código de pairing:', codigo)
}
```

### Recibir Historial Completo

```ts
const sock = makeWASocket({
  browser: Browsers.macOS('Desktop'),
  syncFullHistory: true,
})
```

---

## Guardar Sesión

Para no escanear el QR cada vez, guarda las credenciales:

```ts
import makeWASocket, { useMultiFileAuthState } from 'baileys-natsu'

const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

const sock = makeWASocket({ auth: state })

sock.ev.on('creds.update', saveCreds)
```

> [!IMPORTANT]
> `useMultiFileAuthState` guarda en una carpeta. Para producción se recomienda usar una base de datos.

---

## Eventos

### Ejemplo Completo

```ts
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from 'baileys-natsu'
import { Boom } from '@hapi/boom'

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info')

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  })

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) connect()
    } else if (connection === 'open') {
      console.log('Conectado')
    }
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) {
      if (msg.key.fromMe) continue
      console.log('Mensaje:', msg.message?.conversation)
    }
  })

  sock.ev.on('messages.update', (updates) => {
    for (const { key, update } of updates) {
      if (update.pollUpdates) {
        const aggregation = getAggregateVotesInPollMessage({
          message: pollCreation,
          pollUpdates: update.pollUpdates,
        })
      }
    }
  })

  sock.ev.on('presence.update', ({ id, presences }) => {
    for (const [participant, data] of Object.entries(presences)) {
      console.log(`${participant}: ${data.lastKnownPresence}`)
    }
  })

  sock.ev.on('group-participants.update', ({ id, participants, action }) => {
    console.log(`Grupo ${id}: ${action} -> ${participants.join(', ')}`)
  })

  sock.ev.on('call', (calls) => {
    for (const call of calls) {
      console.log(`Llamada de ${call.from}: ${call.status}`)
    }
  })
}

connect()
```

---

## Enviar Mensajes

```ts
const jid = '521234567890@s.whatsapp.net'
```

### Texto

```ts
await sock.sendMessage(jid, { text: 'Hola mundo!' })
```

### Citar Mensaje

```ts
await sock.sendMessage(jid, { text: 'Respuesta' }, { quoted: msg })
```

### Mencionar

```ts
await sock.sendMessage(jid, {
  text: '@52123456789',
  mentions: ['52123456789@s.whatsapp.net'],
})
```

### Reacción

```ts
await sock.sendMessage(jid, {
  react: { key: msg.key, text: '👍' },
})
```

### Ubicación

```ts
await sock.sendMessage(jid, {
  location: {
    degreesLatitude: 19.43,
    degreesLongitude: -99.13,
  },
})
```

### Contacto

```ts
const vcard = 'BEGIN:VCARD\nVERSION:3.0\nFN:Contacto\nTEL;type=CELL:+521234567890\nEND:VCARD'

await sock.sendMessage(jid, {
  contacts: {
    displayName: 'Contacto',
    contacts: [{ vcard }],
  },
})
```

### Encuesta

```ts
await sock.sendMessage(jid, {
  poll: {
    name: 'Color favorito?',
    values: ['Rojo', 'Azul', 'Verde'],
    selectableCount: 1,
  },
})
```

### Imagen

```ts
await sock.sendMessage(jid, {
  image: { url: './foto.jpg' },
  caption: 'Foto',
})
```

### Video

```ts
await sock.sendMessage(jid, {
  video: { url: './video.mp4' },
  caption: 'Video',
  seconds: 30,
  gifPlayback: false,
})
```

### Video Nota (PTV)

```ts
await sock.sendMessage(jid, {
  video: { url: './video.mp4' },
  ptv: true,
})
```

### Audio

```ts
await sock.sendMessage(jid, {
  audio: { url: './audio.mp3' },
  mimetype: 'audio/mp4',
  ptt: true, // nota de voz
})
```

### Documento

```ts
await sock.sendMessage(jid, {
  document: { url: './archivo.pdf' },
  fileName: 'archivo.pdf',
  mimetype: 'application/pdf',
})
```

### Sticker

```ts
await sock.sendMessage(jid, {
  sticker: { url: './sticker.webp' },
})
```

### ViewOnce

```ts
await sock.sendMessage(jid, {
  image: { url: './foto.jpg' },
  viewOnce: true,
  caption: 'Mensaje de una sola vista',
})
```

### Editar Mensaje

```ts
await sock.sendMessage(jid, {
  text: 'Texto actualizado',
  edit: msg.key,
})
```

### Eliminar Mensaje

```ts
await sock.sendMessage(jid, { delete: msg.key })
```

### Reenviar

```ts
await sock.sendMessage(jid, { forward: msg })
```

---

## Manipular Media

### Descargar Media

```ts
import { downloadMediaMessage, getContentType } from 'baileys-natsu'

sock.ev.on('messages.upsert', async ({ messages }) => {
  for (const msg of messages) {
    const mType = getContentType(msg)
    if (mType === 'imageMessage') {
      const buffer = await downloadMediaMessage(msg, 'buffer', {})
      // guardar buffer...
    }
  }
})
```

### Thumbnails

- Para imágenes: instala `jimp` o `sharp` como dependencia opcional
- Para videos: necesitas `ffmpeg` instalado en el sistema

---

## Presencia

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

## Modificar Chats

```ts
// Marcar como leído
await sock.readMessages([msg.key])

// Archivar chat
const lastMsg = await getLastMessage(jid)
await sock.chatModify({ archive: true, lastMessages: [{ key: lastMsg.key, messageTimestamp: lastMsg.messageTimestamp }] }, jid)

// Silenciar 8 horas
await sock.chatModify({ mute: 8 * 60 * 60 * 1000 }, jid)

// Fijar chat
await sock.chatModify({ pin: true }, jid)

// Marcar como no leído
await sock.chatModify({ markRead: false, lastMessages: [/*...*/] }, jid)
```

---

## Grupos

```ts
// Crear grupo
const group = await sock.groupCreate('Mi Grupo', [
  '5211111111111@s.whatsapp.net',
  '5222222222222@s.whatsapp.net',
])

// Obtener metadata
const meta = await sock.groupMetadata(group.id)

// Cambiar nombre
await sock.groupUpdateSubject(group.id, 'Nuevo Nombre')

// Cambiar descripción
await sock.groupUpdateDescription(group.id, 'Nueva descripción')

// Participantes: add, remove, promote, demote
await sock.groupParticipantsUpdate(group.id, ['5233333333333@s.whatsapp.net'], 'add')

// Configurar: announcement (solo admins) / not_announcement (todos)
await sock.groupSettingUpdate(group.id, 'announcement')

// Obtener código de invitación
const code = await sock.groupInviteCode(group.id)
// https://chat.whatsapp.com/ + code

// Revocar código
await sock.groupRevokeInvite(group.id)

// Aceptar invitación
const jid = await sock.groupAcceptInvite(code)

// Obtener info por código
const info = await sock.groupGetInviteInfo(code)

// Mensajes temporales (7 días)
await sock.groupToggleEphemeral(group.id, 604800)

// Solicitudes de unión
const requests = await sock.groupRequestParticipantsList(group.id)
await sock.groupRequestParticipantsUpdate(group.id, ['5233333333333@s.whatsapp.net'], 'approve')

// Modo añadir: admin_add / all_member_add
await sock.groupMemberAddMode(group.id, 'all_member_add')

// Salir del grupo
await sock.groupLeave(group.id)
```

### Ephemeral (Mensajes Temporales)

| Duración | Segundos |
|----------|----------|
| Apagar   | 0 |
| 24h      | 86400 |
| 7d       | 604800 |
| 90d      | 7776000 |

---

## Perfil

```ts
// Obtener foto de perfil
const url = await sock.profilePictureUrl(jid, 'image')

// Verificar si existe en WhatsApp
const [result] = await sock.onWhatsApp(jid)
if (result.exists) console.log('Existe:', result.jid)

// Obtener estado
const status = await sock.fetchStatus(jid)

// Cambiar nombre
await sock.updateProfileName('Mi Nombre')

// Cambiar estado
await sock.updateProfileStatus('Mi estado')

// Cambiar foto de perfil
await sock.updateProfilePicture(jid, { url: './foto.jpg' })

// Eliminar foto de perfil
await sock.removeProfilePicture(jid)
```

---

## Privacidad

```ts
// Bloquear / desbloquear
await sock.updateBlockStatus(jid, 'block')
await sock.updateBlockStatus(jid, 'unblock')

// Obtener lista de bloqueados
const blocklist = await sock.fetchBlocklist()

// Obtener configuración de privacidad
const privacy = await sock.fetchPrivacySettings(true)

// Actualizar privacidad
await sock.updateLastSeenPrivacy('all') // contacts | contact_blacklist | none
await sock.updateOnlinePrivacy('all')   // match_last_seen
await sock.updateProfilePicturePrivacy('all')
await sock.updateStatusPrivacy('all')
await sock.updateReadReceiptsPrivacy('all')

// Modo desaparecido por defecto
await sock.updateDefaultDisappearingMode(86400)
```

---

## Utilidades

```ts
import { getContentType, getDevice, downloadContentFromMessage, makeCacheableSignalKeyStore } from 'baileys-natsu'

// Obtener tipo de contenido
const type = getContentType(msg)

// Obtener dispositivo
const device = getDevice(msg)

// Cache de signal store
const cachedStore = makeCacheableSignalKeyStore(keys, logger)
```

---

## Disclaimer

Este proyecto no está afiliado, asociado, autorizado, respaldado ni conectado oficialmente con WhatsApp o cualquiera de sus subsidiarias o afiliadas.

El uso de esta librería es bajo tu propia responsabilidad. No uses esta librería para spam, mensajes automatizados masivos o cualquier otra actividad que viole los Términos de Servicio de WhatsApp.

## License

MIT
