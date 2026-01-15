/* plugins/_autoadmin.js
   AUTO-ADMIN SILENCIOSO PARA OWNERS
   - aaa → darte admin
   - aad → sacarte admin
*/

let handler = async (m, { conn }) => {

  // Solo funciona en grupos
  if (!m.isGroup) return

  // 🔐 Verificación REAL de dueños desde config.js
  const owners = (global.owner || []).map(v => {
    if (Array.isArray(v)) v = v[0]
    if (typeof v !== 'string') return null
    return v.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
  }).filter(Boolean)

  const sender = conn.decodeJid ? conn.decodeJid(m.sender) : m.sender
  if (!owners.includes(sender)) return

  const text = m.text?.toLowerCase()
  if (!text) return

  try {
    const chatId = m.chat
    const groupMetadata = await conn.groupMetadata(chatId)
    const participants = groupMetadata.participants

    const user = participants.find(p => p.id === sender)
    if (!user) return

    if (text === 'aaa' && !user.admin) {
      await conn.groupParticipantsUpdate(chatId, [user.id], 'promote')
    }

    if (text === 'aad' && user.admin) {
      await conn.groupParticipantsUpdate(chatId, [user.id], 'demote')
    }

  } catch {
    // completamente silencioso
  }
}

// Detecta solo "aaa" o "aad", sin prefijo
handler.customPrefix = /^(aaa|aad)$/i
handler.command = new RegExp()

export default handler
