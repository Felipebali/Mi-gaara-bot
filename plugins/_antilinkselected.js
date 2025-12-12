// 📂 plugins/antilinks-multi.js — FIX DEFINITIVO 2025

const isLinkTikTok = /tiktok\.com/i
const isLinkTelegram = /(telegram\.com|t\.me)\//i
const isLinkInstagram = /instagram\.com/i

// ======================================================
// 📌 HANDLER PARA ACTIVAR/DESACTIVAR
// ======================================================

let handler = async (m, { conn, command, isAdmin }) => {
  let chat = global.db.data.chats[m.chat]
  if (!chat) global.db.data.chats[m.chat] = chat = {}

  if (!isAdmin)
    return m.reply("❌ *Solo administradores pueden usar este comando.*")

  let toggle = {
    antitiktok: "antiTiktok",
    antitelegram: "antiTelegram",
    antiinsta: "antiInstagram"
  }[command]

  chat[toggle] = !chat[toggle]

  return m.reply(
    `🔗 *${command.toUpperCase()} ahora está:* ${chat[toggle] ? "🟢 ACTIVADO" : "🔴 DESACTIVADO"}`
  )
}

handler.command = ["antitiktok", "antitelegram", "antiinsta"]
handler.group = true
handler.admin = true
export default handler

// ======================================================
// 📌 BEFORE — DETECTOR DE LINKS AUTOMÁTICO (FIX)
// ======================================================

export async function before(m, { conn, isAdmin, isBotAdmin }) {
  if (!m.isGroup) return
  if (isAdmin) return

  // 🔥 OBTENER TEXTO REAL DEL MENSAJE (FIX)
  let text =
    m.text ||
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    ""

  if (!text) return

  let chat = global.db.data.chats[m.chat]
  if (!chat) return

  let tiktok = isLinkTikTok.test(text)
  let telegram = isLinkTelegram.test(text)
  let instagram = isLinkInstagram.test(text)

  const senderTag = '@' + m.sender.split('@')[0]

  // ============================
  // 🔥 Anti TikTok
  // ============================
  if (chat.antiTiktok && tiktok) {
    if (!isBotAdmin)
      return conn.reply(m.chat, `🚫 No se permiten links de *TikTok*\n${senderTag}`, m, {
        mentions: [m.sender]
      })

    try { await m.delete() } catch {}
    return conn.reply(
      m.chat,
      `🗑️ *Se eliminó un link de TikTok.*\n${senderTag}`,
      null,
      { mentions: [m.sender] }
    )
  }

  // ============================
  // 🔥 Anti Telegram
  // ============================
  if (chat.antiTelegram && telegram) {
    if (!isBotAdmin)
      return conn.reply(m.chat, `🚫 No se permiten links de *Telegram*\n${senderTag}`, m, {
        mentions: [m.sender]
      })

    try { await m.delete() } catch {}
    return conn.reply(
      m.chat,
      `🗑️ *Se eliminó un link de Telegram.*\n${senderTag}`,
      null,
      { mentions: [m.sender] }
    )
  }

  // ============================
  // 🔥 Anti Instagram
  // ============================
  if (chat.antiInstagram && instagram) {
    if (!isBotAdmin)
      return conn.reply(m.chat, `🚫 No se permiten links de *Instagram*\n${senderTag}`, m, {
        mentions: [m.sender]
      })

    try { await m.delete() } catch {}
    return conn.reply(
      m.chat,
      `🗑️ *Se eliminó un link de Instagram.*\n${senderTag}`,
      null,
      { mentions: [m.sender] }
    )
  }
}
