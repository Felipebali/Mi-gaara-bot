/* plugins/_autoadmin.js
   AUTO-ADMIN SILENCIOSO PARA OWNERS
   - aaa → darte admin
   - aad → sacarte admin
*/

let handler = async (m, { conn }) => {

  // 🔐 SOLO ROOT OWNERS (desde config.js)
  if (!m.isROwner) return

  // Solo funciona en grupos
  if (!m.isGroup) return

  const text = m.text?.toLowerCase()
  if (!text) return

  try {
    const chatId = m.chat
    const groupMetadata = await conn.groupMetadata(chatId)
    const participants = groupMetadata.participants

    const user = participants.find(p => p.id === m.sender)
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

// ❗ No usar handler.owner ni rowner para que sea invisible
export default handler
