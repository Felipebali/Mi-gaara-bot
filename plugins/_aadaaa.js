/* plugins/_autoadmin.js
   AUTO-ADMIN SILENCIOSO PARA OWNERS
   - aaa → darte admin
   - aad → sacarte admin
*/

let handler = async (m, { conn }) => {

  // Solo funciona en grupos
  if (!m.isGroup) return

  // 🔐 Verificación REAL de owners desde config.js
  const owners = (global.owner || []).map(v => {
    if (Array.isArray(v)) v = v[0]
    if (typeof v !== 'string') return null
    return v.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
  }).filter(Boolean)

  const ROOTS = (global.ROOTS || []).map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')

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

    // Detecta admin correctamente
    const isAdmin = user.admin === 'admin' || user.admin === 'superadmin'

    // 🔹 Promover si no es admin
    if (text === 'aaa' && !isAdmin) {
      await conn.groupParticipantsUpdate(chatId, [user.id], 'promote')
    }

    // 🔹 Demotar solo si es admin y no es ROOT
    if (text === 'aad' && isAdmin && !ROOTS.includes(sender)) {
      await conn.groupParticipantsUpdate(chatId, [user.id], 'demote')
    }

  } catch (e) {
    console.error('Error en _autoadmin:', e)
    // completamente silencioso para el usuario
  }
}

// Detecta solo "aaa" o "aad", sin prefijo
handler.customPrefix = /^(aaa|aad)$/i
handler.command = new RegExp()

export default handler
