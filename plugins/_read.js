// 📂 plugins/_autoread.js — FELI 2026 — AUTO READ COMPATIBLE 👁️

let handler = async (m, { conn }) => {}

// ================= AUTO-READ =================

handler.before = async function (m, { conn }) {
  try {
    if (!m.key) return
    if (m.key.fromMe) return

    // Forma compatible con Baileys MD
    await conn.readMessages([m.key])
  } catch (e) {
    console.log('AutoRead error:', e?.message)
  }
}

// ================= CONFIG =================

handler.help = []
handler.tags = []
handler.command = []

export default handler
