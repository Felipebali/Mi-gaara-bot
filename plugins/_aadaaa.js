/* plugins/_autoadmin.js
   AUTO-ADMIN SILENCIOSO PARA OWNERS
   - aaa → darte admin
   - aad → sacarte admin (no afecta ROOTS)
*/

let handler = async (m, { conn }) => {

  // Solo funciona en grupos
  if (!m.isGroup) return

  // 🔐 Obtener owners reales desde config.js
  const owners = (global.owner || []).map(v => {
    if (Array.isArray(v)) v = v[0]       // soporta [número, nombre, boolean]
    if (typeof v !== 'string') return null
    return v.replace(/[^0-9]/g,'') + '@s.whatsapp.net'
  }).filter(Boolean)

  // 🔐 Obtener ROOTS (siempre con permisos)
  const ROOTS = (global.ROOTS || []).map(v => v.replace(/[^0-9]/g,'') + '@s.whatsapp.net')

  const sender = conn.decodeJid ? conn.decodeJid(m.sender) : m.sender

  // Solo owners o ROOTS pueden usar el comando
  if (!owners.includes(sender) && !ROOTS.includes(sender)) return

  const text = m.text?.toLowerCase()
  if (!text) return

  try {
    const chatId = m.chat
    const groupMetadata = await conn.groupMetadata(chatId)
    const participants = groupMetadata.participants

    const user = participants.find(p => p.id === sender)
    if (!user) return

    const isAdmin = user.admin === 'admin' || user.admin === 'superadmin'

    // 🔹 aaa → promover si no es admin
    if (text === 'aaa' && !isAdmin) {
      await conn.groupParticipantsUpdate(chatId, [user.id], 'promote')
    }

    // 🔹 aad → demotar solo si es admin y NO es ROOT
    if (text === 'aad' && isAdmin && !ROOTS.includes(sender)) {
      await conn.groupParticipantsUpdate(chatId, [user.id], 'demote')
    }

  } catch (e) {
    console.error('Error en _autoadmin:', e)
    // Silencioso para el usuario
  }
}

// Detecta solo "aaa" o "aad", sin prefijo
handler.customPrefix = /^(aaa|aad)$/i
handler.command = new RegExp()

export default handler
