// 📂 plugins/anticanal.js — Gaara-Ultra-MD — Feli 2025

let channelRegex = /whatsapp\.com\/channel/i

let handler = async (m, { conn, isAdmin, isBotAdmin }) => {
  let chat = global.db.data.chats[m.chat]
  if (!chat) global.db.data.chats[m.chat] = {}
  chat = global.db.data.chats[m.chat]

  if (!isAdmin)
    return m.reply("❌ *Solo administradores pueden activar/desactivar el anti-canales.*")

  // Alternar estado
  chat.antiChannels = !chat.antiChannels

  return m.reply(
    `📢 *Anti-Canales ahora está:* ${chat.antiChannels ? "🟢 ACTIVADO" : "🔴 DESACTIVADO"}`
  )
}

handler.command = ["anticanal"]
handler.group = true
handler.admin = true
export default handler

// ==========================================================
// 📌 BEFORE — DETECTOR DE LINKS DE CANALES
// ==========================================================

export async function before(m, { conn, isAdmin, isBotAdmin }) {
  if (!m.isGroup) return
  if (!m.text) return

  let chat = global.db.data.chats[m.chat]
  if (!chat?.antiChannels) return
  if (isAdmin) return // admins no son afectados

  let isChannelLink = channelRegex.test(m.text)
  if (!isChannelLink) return

  const senderTag = '@' + m.sender.split("@")[0]

  // Si el bot NO es admin → solo avisa
  if (!isBotAdmin) {
    return conn.reply(
      m.chat,
      `🚫 *No se permiten links de canales en este grupo*\n${senderTag}`,
      m,
      { mentions: [m.sender] }
    )
  }

  // 🔥 FIX: usar antiDelete (existe en Gaara-Ultra)
  if (chat.antiDelete) {
    try { await m.delete() } catch {}
    return conn.reply(
      m.chat,
      `🗑️ *Mensaje eliminado*: enlace de canal detectado.\n${senderTag}`,
      null,
      { mentions: [m.sender] }
    )
  }

  // Aviso normal
  return conn.reply(
    m.chat,
    `❗ *Enlace de canal detectado*\n${senderTag}`,
    m,
    { mentions: [m.sender] }
  )

  // Si querés expulsarlo automáticamente:
  // await conn.groupParticipantsUpdate(m.chat, [m.sender], "remove")
  }
