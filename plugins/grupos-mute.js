// 📂 plugins/grupos-mute.js — Gaara-Ultra-MD
// Mute + Unmute + Auto-delete mensajes de muteados

let mutedUsers = new Set()

let handler = async (m, { conn, isAdmin, isOwner, command }) => {

// ===============================  
//   AUTO-BORRADO PARA MUTEADOS  
// ===============================
if (mutedUsers.has(m.sender)) {
    try {
        await conn.sendMessage(m.chat, {
            delete: {
                remoteJid: m.chat,
                fromMe: false,
                id: m.key.id,
                participant: m.key.participant || m.sender
            }
        })
    } catch (e) {
        console.log("❌ Error borrando mensaje:", e)
    }
    return
}

// ===============================  
//   VALIDACIONES BÁSICAS  
// ===============================
if (!m.isGroup) return
if (!isAdmin && !isOwner) return
if (!["mute", "unmute"].includes(command)) return

// ===============================  
//   OBTENER @USUARIO  
// ===============================
let who = m.mentionedJid?.[0]
if (!who) return m.reply("⚠️ Debes mencionar a un usuario.")

// ===============================  
//   PROTEGER OWNERS  
// ===============================
const owners = [
    "59896026646@s.whatsapp.net",
    "59898719147@s.whatsapp.net"
]

if (owners.includes(who))
    return m.reply("❌ No puedes mutear/desmutear a un *owner*.")

// Tag clickeable
let tag = "@" + who.split("@")[0]

// ===============================  
//   MUTE  
// ===============================
if (command === "mute") {

    mutedUsers.add(who)

    return conn.sendMessage(m.chat, {
        text: `🔇 *Usuario muteado:* ${tag}`,
        mentions: [who]
    })
}

// ===============================  
//   UNMUTE  
// ===============================
if (command === "unmute") {

    if (!mutedUsers.has(who))
        return m.reply("⚠️ Ese usuario no estaba muteado.")

    mutedUsers.delete(who)

    return conn.sendMessage(m.chat, {
        text: `🔊 *Usuario desmuteado:* ${tag}`,
        mentions: [who]
    })
}

}

handler.help = ["mute @usuario", "unmute @usuario"]
handler.tags = ["group"]
handler.command = ["mute", "unmute"]
handler.group = true
handler.admin = true

export default handler
