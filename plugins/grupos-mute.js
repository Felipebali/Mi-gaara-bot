// 📂 plugins/grupos-mute.js — Gaara-Ultra-MD
// Mute + Unmute + AutoDelete REAL funcionando

let mutedUsers = new Set()

// =============================
// 🔥 AUTO-BORRAR MENSAJES
// =============================
let handler = m => m // obligatorio para que el plugin cargue

handler.all = async function (m, { conn }) {

    // Si el usuario está muteado → eliminar mensaje
    if (mutedUsers.has(m.sender)) {
        try {
            await conn.sendMessage(m.chat, { delete: m.key })
        } catch (e) {
            // No mostrar errores
        }
        return
    }

}

// =============================
// 🔥 COMANDOS MUTE & UNMUTE
// =============================
handler.before = async function (m, { conn, isAdmin, isOwner, command }) {

    if (!m.isGroup) return
    if (!isAdmin && !isOwner) return
    if (!["mute", "unmute"].includes(command)) return

    let who = m.mentionedJid?.[0]
    if (!who) return m.reply("⚠️ Debes mencionar un usuario.")

    const owners = [
        "59896026646@s.whatsapp.net",
        "59898719147@s.whatsapp.net"
    ]
    if (owners.includes(who))
        return m.reply("❌ No puedes usar este comando en un owner.")

    let number = who.split("@")[0]
    let tag = "@" + number

    // MUTE
    if (command === "mute") {
        mutedUsers.add(who)
        return await conn.sendMessage(m.chat, {
            text: `🔇 *Usuario muteado:* ${tag}`,
            mentions: [who]
        })
    }

    // UNMUTE
    if (command === "unmute") {

        if (!mutedUsers.has(who))
            return m.reply("⚠️ Ese usuario no estaba muteado.")

        mutedUsers.delete(who)

        return await conn.sendMessage(m.chat, {
            text: `🔊 *Usuario desmuteado:* ${tag}`,
            mentions: [who]
        })
    }
}

handler.help = ["mute @usuario", "unmute @usuario"]
handler.tags = ["group"]
handler.command = ["mute", "unmute"]
handler.admin = true
handler.group = true

export default handler
