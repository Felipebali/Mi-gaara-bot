// ✨ FATÍDICO PLUGIN DETECT — FELIXCAT BOT — FULL STUB SUPPORT ✨
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import fetch from 'node-fetch'
let { default: WAMessageStubType } = await import('@whiskeysockets/baileys')

const lidCache = new Map()

const handler = {}
export default handler

// =====================================================
// COMANDO .evento (TOGGLE)
// =====================================================
handler.command = ['evento']
handler.group = true
handler.admin = true

handler.handler = async function (m, { conn, isAdmin, isOwner }) {
  if (!isAdmin && !isOwner)
    return conn.reply(m.chat, '🚫 Solo admins pueden usar este comando.', m)

  const chat = global.db.data.chats[m.chat]
  if (!chat) return

  chat.detect = !chat.detect

  await conn.reply(
    m.chat,
    `✨ *Detector de eventos*\n\nEstado: ${chat.detect ? '🟢 ACTIVADO' : '🔴 DESACTIVADO'}`,
    m
  )
}

// =====================================================
// BEFORE — DETECTOR DE EVENTOS
// =====================================================
handler.before = async function (m, { conn, participants }) {
  if (!m.messageStubType || !m.isGroup) return

  const chat = global.db.data.chats[m.chat]
  if (!chat || !chat.detect) return

  const primaryBot = chat.primaryBot
  if (primaryBot && conn.user.jid !== primaryBot) return

  const users = m.messageStubParameters?.[0] || ''
  const usuario = await resolveLidToRealJid(m?.sender, conn, m?.chat)
  const groupAdmins = participants.filter(p => p.admin)

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

  const newlink = `🔗💫 ¡Enlace del grupo actualizado! 💫🔗

✦ Gracias a: @${usuario.split('@')[0]}
Ahora todos pueden unirse de nuevo 🌸`

  const edit = `🔧✨ Configuración del grupo ✨🔧

@${usuario.split('@')[0]} ha decidido que ${
    m.messageStubParameters[0] == 'on'
      ? 'solo los admins 🌟'
      : 'todos los miembros 🌼'
  } puedan modificar el grupo.`

  const descripcion = `📝✨ ¡Descripción actualizada! ✨📝

@${usuario.split('@')[0]} modificó la descripción del grupo.

📄 Nueva descripción:
*${m.messageStubParameters[0]}*`

  const admingp = `🌟✨ ¡Admin nuevo! ✨🌟

@${users.split('@')[0]} ahora es admin del grupo.
🖇️ Acción realizada por: @${usuario.split('@')[0]} 💖`

  const noadmingp = `🌸⚡ ¡Admin removido! ⚡🌸

@${users.split('@')[0]} ya no tiene permisos de admin.
🖇️ Acción realizada por: @${usuario.split('@')[0]} 💌`

  // ===============================
  // RESPUESTAS POR STUB
  // ===============================

  // 21 — Cambio nombre
  if (m.messageStubType == 21)
    return conn.sendMessage(m.chat, {
      text: nombre,
      mentions: [usuario, ...groupAdmins.map(v => v.id)]
    })

  // 22 — Cambio foto
  if (m.messageStubType == 22)
    return conn.sendMessage(m.chat, {
      image: { url: pp },
      caption: foto,
      mentions: [usuario, ...groupAdmins.map(v => v.id)]
    })

  // 23 — Nuevo link
  if (m.messageStubType == 23)
    return conn.sendMessage(m.chat, {
      text: newlink,
      mentions: [usuario, ...groupAdmins.map(v => v.id)]
    })

  // 24 — Cambio descripción
  if (m.messageStubType == 24)
    return conn.sendMessage(m.chat, {
      text: descripcion,
      mentions: [usuario, ...groupAdmins.map(v => v.id)]
    })

  // 25 — Editar configuración
  if (m.messageStubType == 25)
    return conn.sendMessage(m.chat, {
      text: edit,
      mentions: [usuario, ...groupAdmins.map(v => v.id)]
    })

  // 29 — Dar admin
  if (m.messageStubType == 29)
    return conn.sendMessage(m.chat, {
      text: admingp,
      mentions: [usuario, users, ...groupAdmins.map(v => v.id)].filter(Boolean)
    })

  // 30 — Quitar admin
  if (m.messageStubType == 30)
    return conn.sendMessage(m.chat, {
      text: noadmingp,
      mentions: [usuario, users, ...groupAdmins.map(v => v.id)].filter(Boolean)
    })
}

// =====================================================
// RESOLVE LID → JID REAL
// =====================================================
async function resolveLidToRealJid(lid, conn, groupChatId, maxRetries = 3, retryDelay = 60000) {
  const inputJid = lid.toString()

  if (!inputJid.endsWith('@lid') || !groupChatId?.endsWith('@g.us'))
    return inputJid.includes('@') ? inputJid : `${inputJid}@s.whatsapp.net`

  if (lidCache.has(inputJid)) return lidCache.get(inputJid)

  const lidToFind = inputJid.split('@')[0]
  let attempts = 0

  while (attempts < maxRetries) {
    try {
      const metadata = await conn.groupMetadata(groupChatId)
      if (!metadata?.participants) throw new Error()

      for (const participant of metadata.participants) {
        try {
          if (!participant?.jid) continue
          const check = await conn.onWhatsApp(participant.jid)
          if (!check?.[0]?.lid) continue

          if (check[0].lid.split('@')[0] === lidToFind) {
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
      await new Promise(r => setTimeout(r, retryDelay))
    }
  }

  return inputJid
    }
