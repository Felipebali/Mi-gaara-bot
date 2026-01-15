// plugins/_admin-request.js
// 👑 Auto-admin por frase — SOLO OWNERS del config.js

let handler = async (m, { conn }) => {
  try {
    if (!m.isOwner) return
    if (!m.isGroup) return

    const text = (m.text || '').toLowerCase().trim()
    if (!/^(dame admin|quiero admin)$/.test(text)) return

    await conn.groupParticipantsUpdate(m.chat, [m.sender], 'promote')

    await conn.sendMessage(m.chat, {
      text: `Listo @${m.sender.split('@')[0]} 😌`,
      mentions: [m.sender]
    })

  } catch (err) {
    console.error('Error en _admin-request.js:', err)
  }
}

handler.customPrefix = /^(dame admin|quiero admin)$/i
handler.command = new RegExp()
handler.group = true
handler.owner = true   // 🔐 Toma los owners desde config.js

export default handler
