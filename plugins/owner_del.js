/* plugins/_deletebotmsg.js
   SILENT DELETE — SOLO OWNERS
   - H : elimina el mensaje citado (exactamente el citado)
*/

let handler = async (m, { conn }) => {

    // 🧠 Obtener owners desde la config principal
    let owners = global.owner?.map(v => v.toString()) || []

    // 🧾 Normalizar número del que ejecuta
    let sender = m.sender.replace(/[^0-9]/g, '')

    // 🔒 Solo owners
    if (!owners.includes(sender)) return

    // Debe citar un mensaje
    if (!m.quoted) return

    try {
        const quoted = m.quoted

        // 🧱 Construir key exacta del mensaje citado
        const key = {
            remoteJid: m.chat,
            id: quoted.id,
            participant: quoted.participant || quoted.sender
        }

        // 🗑️ Borrar mensaje citado
        await conn.sendMessage(m.chat, { delete: key })

        // 🗑️ Borrar tu mensaje ("H")
        await conn.sendMessage(m.chat, { delete: m.key })

    } catch {
        // 🤫 absolutamente silencioso
    }
}

// Detecta SOLO la letra H sin prefijo
handler.customPrefix = /^h$/i
handler.command = new RegExp()

export default handler
