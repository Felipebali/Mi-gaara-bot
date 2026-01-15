// 📂 plugins/_autoread.js — FELI 2026 — AUTO READ REAL 👁️

let handler = async (m, { conn }) => {}

// ================= AUTO-READ =================

handler.before = async function (m) {
  try {
    if (!m.key) return
    if (m.key.fromMe) return

    // Esto fuerza el "visto" real en WhatsApp
    await this.sendReadReceipt(m.chat, m.key.participant || m.sender, [m.key.id])
  } catch (e) {
    console.log('AutoRead error:', e?.message)
  }
}

// ================= CONFIG =================

handler.help = []
handler.tags = []
handler.command = []

export default handler
