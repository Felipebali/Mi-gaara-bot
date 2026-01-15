// 📂 plugins/_autoread.js — FELI 2026 — AUTO READ DEFINITIVO 👁️

let handler = async (m, { conn }) => {}

// ================= AUTO-READ =================

handler.before = async function (m, { conn }) {
  try {
    if (!m.chat) return
    if (m.key.fromMe) return

    // Fuerza el "visto" real del chat
    await conn.chatModify({ markRead: true }, m.chat)
  } catch (e) {
    console.log('AutoRead error:', e?.message)
  }
}

// ================= CONFIG =================

handler.help = []
handler.tags = []
handler.command = []

export default handler
