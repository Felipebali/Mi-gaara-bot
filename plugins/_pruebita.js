import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import fetch from 'node-fetch'
let { default: WAMessageStubType } = await import('@whiskeysockets/baileys')

const groupMetadataCache = new Map()
const lidCache = new Map()

const handler = {}
export default handler

handler.before = async function (m, { conn, participants, groupMetadata }) {
  if (!m.messageStubType || !m.isGroup) return

  const chat = global.db.data.chats[m.chat]
  if (!chat) return

  const primaryBot = chat.primaryBot
  if (primaryBot && conn.user.jid !== primaryBot) return

  const users = m.messageStubParameters?.[0] || ''
  const usuario = await resolveLidToRealJid(m?.sender, conn, m?.chat)
  const groupAdmins = participants.filter(p => p.admin)

  // Foto grupo
  const pp = await conn.profilePictureUrl(m.chat, 'image').catch(_ => null)
    || 'https://files.catbox.moe/xr2m6u.jpg'

  // ===============================
  // MENSAJES
  // ===============================
  const nombre = `🌸✨ ¡NUEVO NOMBRE! ✨🌸
  
@${usuario.split('@')[0]} decidió darle un nuevo nombre.
💌 Ahora se llama: *${m.messageStubParameters[0]}*`

  const foto = `🖼️🌷 ¡Foto renovada! 🌷🖼️

👀 Acción hecha por: @${usuario.split('@')[0]}`

  const edit = `🔧✨ Configuración del grupo ✨🔧

@${usuario.split('@')[0]} ha decidido que ${
    m.messageStubParameters[0] == 'on'
      ? 'solo los admins 🌟'
      : 'todos los miembros 🌼'
  } puedan modificar el grupo.`

  const newlink = `🔗💫 ¡Enlace del grupo actualizado! 💫🔗

✦ Gracias a: @${usuario.split('@')[0]}
Ahora todos pueden unirse de nuevo 🌸`

  const status = `🚦🌸 Estado del grupo 🌸🚦

El grupo ha sido ${
    m.messageStubParameters[0] == 'on' ? '*cerrado* 🔒' : '*abierto* 🔓'
  }.
✦ Por: @${usuario.split('@')[0]}
🌿 ${
    m.messageStubParameters[0] == 'on'
      ? 'Solo admins pueden enviar mensajes'
      : 'Todos pueden enviar mensajes'
  }`

  const admingp = `🌟✨ ¡Admin nuevo! ✨🌟

@${users.split('@')[0]} ahora es admin del grupo.
🖇️ Acción realizada por: @${usuario.split('@')[0]} 💖`

  const noadmingp = `🌸⚡ ¡Admin removido! ⚡🌸

@${users.split('@')[0]} ya no tiene permisos de admin.
🖇️ Acción realizada por: @${usuario.split('@')[0]} 💌`

  // ===============================
  // BORRADO DE SESSIONS
  // ===============================
  if (chat.detect && m.messageStubType == 2) {
    const uniqid = (m.isGroup ? m.chat : m.sender).split('@')[0]
    const sessionPath = './sessions/'

    for (const file of await fs.promises.readdir(sessionPath)) {
      if (file.includes(uniqid)) {
        await fs.promises.unlink(path.join(sessionPath, file))
        console.log(
          `${chalk.yellow.bold('✎ Delete!')} ${chalk.greenBright(`'${file}'`)}\n${chalk.redBright('Que provoca el "undefined" en el chat.')}`
        )
      }
    }
  }

  // ===============================
  // RESPUESTAS
  // ===============================

  // NOMBRE
  if (chat.detect && m.messageStubType == 21) {
    await conn.sendMessage(m.chat, {
      text: nombre,
      mentions: [usuario, ...groupAdmins.map(v => v.id)],
    })
  }

  // FOTO
  if (chat.detect && m.messageStubType == 22) {
    await conn.sendMessage(m.chat, {
      image: { url: pp },
      caption: foto,
      mentions: [usuario, ...groupAdmins.map(v => v.id)],
    })
  }

  // NUEVO LINK
  if (chat.detect && m.messageStubType == 23) {
    await conn.sendMessage(m.chat, {
      text: newlink,
      mentions: [usuario, ...groupAdmins.map(v => v.id)],
    })
  }

  // EDIT CONFIG
  if (chat.detect && m.messageStubType == 25) {
    await conn.sendMessage(m.chat, {
      text: edit,
      mentions: [usuario, ...groupAdmins.map(v => v.id)],
    })
  }

  // STATUS
  if (chat.detect && m.messageStubType == 26) {
    await conn.sendMessage(m.chat, {
      text: status,
      mentions: [usuario, ...groupAdmins.map(v => v.id)],
    })
  }

  // NUEVO ADMIN
  if (chat.detect && m.messageStubType == 29) {
    await conn.sendMessage(m.chat, {
      text: admingp,
      mentions: [usuario, users, ...groupAdmins.map(v => v.id)].filter(Boolean),
    })
  }

  // ADMIN REMOVIDO
  if (chat.detect && m.messageStubType == 30) {
    await conn.sendMessage(m.chat, {
      text: noadmingp,
      mentions: [usuario, users, ...groupAdmins.map(v => v.id)].filter(Boolean),
    })
  }
}

// ===============================
// RESOLVE LID
// ===============================
async function resolveLidToRealJid(lid, conn, groupChatId, maxRetries = 3, retryDelay = 60000) {
  const inputJid = lid.toString()

  if (!inputJid.endsWith('@lid') || !groupChatId?.endsWith('@g.us')) {
    return inputJid.includes('@') ? inputJid : `${inputJid}@s.whatsapp.net`
  }

  if (lidCache.has(inputJid)) return lidCache.get(inputJid)

  const lidToFind = inputJid.split('@')[0]
  let attempts = 0

  while (attempts < maxRetries) {
    try {
      const metadata = await conn?.groupMetadata(groupChatId)
      if (!metadata?.participants) throw new Error('No se obtuvieron participantes')

      for (const participant of metadata.participants) {
        try {
          if (!participant?.jid) continue
          const contactDetails = await conn?.onWhatsApp(participant.jid)
          if (!contactDetails?.[0]?.lid) continue

          const possibleLid = contactDetails[0].lid.split('@')[0]
          if (possibleLid === lidToFind) {
            lidCache.set(inputJid, participant.jid)
            return participant.jid
          }
        } catch {}
      }

      lidCache.set(inputJid, inputJid)
      return inputJid
    } catch {
      attempts++
      if (attempts >= maxRetries) {
        lidCache.set(inputJid, inputJid)
        return inputJid
      }
      await new Promise(res => setTimeout(res, retryDelay))
    }
  }

  return inputJid
}
