// 📂 plugins/grupos-mute.js — Gaara-Ultra-MD
// Mute + Unmute + Auto-delete (handler.before REAL)

let mutedUsers = new Set()

// ==========================================
//   BORRADO AUTOMÁTICO — SE EJECUTA PRIMERO
// ==========================================
let before = async (m, { conn, isBotAdmin }) => {
    try {
        if (!m.isGroup) return

        const sender = m.sender || m.participant

        if (mutedUsers.has(sender)) {

            if (!isBotAdmin) return  // El bot debe ser admin

            await conn.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: m.key.id,
                    participant: m.key.participant || sender
                }
            })
        }

    } catch (e) {
        console.log("Error borrando mensaje de muteado:", e)
    }
    return true
}

// ==========================================
//   COMANDO MUTE / UNMUTE
// ==========================================
let handler = async (m, { conn, isAdmin, isOwner, isBotAdmin, command }) => {
    if (!m.isGroup) return
    if (!isAdmin && !isOwner) return
    if (!["mute", "unmute"].includes(command)) return

    let who = m.mentionedJid?.[0] || m.quoted?.sender
    if (!who) return m.reply("⚠️ Menciona o responde a un usuario.")

    const owners = [
        "59896026646@s.whatsapp.net",
        "59898719147@s.whatsapp.net"
    ]

    if (owners.includes(who))
        return m.reply("❌ No puedes mutear a un owner.")

    let tag = "@" + who.split("@")[0]

    if (command === "mute") {
        mutedUsers.add(who)
        return conn.sendMessage(m.chat, {
            text: `🔇 *Usuario muteado:* ${tag}`,
            mentions: [who]
        })
    }

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

handler.before = before
handler.help = ["mute @usuario", "unmute @usuario"]
handler.tags = ["group"]
handler.command = ["mute", "unmute"]
handler.admin = true
handler.group = true

export default handler
