/* plugins/_autoadmin.js
   AUTO-ADMIN SILENCIOSO PARA OWNERS
   - aaa: darte admin
   - aad: sacarte admin
*/

let handler = async (m, { conn }) => {

    // 🧠 Tomamos owners desde la config global
    let owners = global.owner?.map(v => v.toString()) || []

    let sender = m.sender.split('@')[0]

    // 🔒 Ignorar todo si no es owner
    if (!owners.includes(sender)) return

    // Solo funciona en grupos
    if (!m.isGroup) return

    let text = m.text?.toLowerCase()
    if (!text) return

    try {
        let chatId = m.chat
        let metadata = await conn.groupMetadata(chatId)
        let user = metadata.participants.find(p => p.id.split('@')[0] === sender)
        if (!user) return

        if (text === 'aaa' && !user.admin) {
            await conn.groupParticipantsUpdate(chatId, [user.id], 'promote')
        } 
        else if (text === 'aad' && user.admin) {
            await conn.groupParticipantsUpdate(chatId, [user.id], 'demote')
        }

    } catch {
        // 🤫 completamente silencioso
    }
}

// 🎯 Solo detecta aaa / aad, sin prefijo
handler.customPrefix = /^(aaa|aad)$/i
handler.command = new RegExp()

export default handler
