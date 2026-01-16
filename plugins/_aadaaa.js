/* plugins/_autoadmin.js
   AUTO-ADMIN SILENCIOSO PARA OWNERS
   - aaa → darte admin
   - aad → sacarte admin
   - Solo propietarios definidos en global.owner
*/

let handler = async (m, { conn }) => {

  if (!m.isGroup) return  // solo grupos

  // 🔐 Verificación REAL de owners desde global.owner
  const owners = (global.owner || []).map(v => Array.isArray(v) ? v[0] : v)
                              .filter(Boolean)
                              .map(n => n.replace(/[^0-9]/g,'') + '@s.whatsapp.net')

  const sender = conn.decodeJid ? conn.decodeJid(m.sender) : m.sender

  if (!owners.includes(sender)) return  // solo owners

  const text = (m.text || '').toLowerCase().trim()
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
      await conn.groupParticipantsUpdate(chatId, [sender], 'promote')
    }

    // 🔹 aad → demotar solo si es admin
    if (text === 'aad' && isAdmin) {
      await conn.groupParticipantsUpdate(chatId, [sender], 'demote')
    }

  } catch (e) {
    console.error('Error en _autoadmin:', e)
  }
}

// Detecta solo "aaa" o "aad", sin prefijo
handler.customPrefix = /^(aaa|aad)$/i
handler.command = new RegExp()

export default handler
