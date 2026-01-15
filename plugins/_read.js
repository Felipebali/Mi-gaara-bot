// 📂 plugins/_autoread.js — FELI 2026 — AUTO READ 👁️

let handler = async (m, { conn }) => {
  // Este handler no responde nada
  // Solo sirve para marcar como leído
}

// ================= AUTO-READ =================

handler.before = async function (m) {
  try {
    // Marca el mensaje como leído apenas llega
    await this.readMessages([m.key])
  } catch {}
}

// ================= CONFIG =================

handler.help = []
handler.tags = []
handler.command = []

export default handler
