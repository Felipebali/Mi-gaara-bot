// 📂 plugins/antiver.js — FELI 2025
// Marca automáticamente como leídos TODOS los mensajes de grupos

export async function before(m, { conn }) {
  try {
    // Solo grupos
    if (!m.isGroup) return

    // Ignorar mensajes propios del bot
    if (m.fromMe) return

    // 👁️ AUTO READ (ver mensajes)
    await conn.readMessages([m.key])

  } catch (e) {
    console.error('ANTIVER error:', e)
  }
}
