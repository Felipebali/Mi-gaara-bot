// 📂 plugins/grupos-mute.js — Gaara-Ultra-MD
// Mute + Unmute + Auto-Delete para muteados
// TODO en un solo plugin 🔥

let mutedUsers = new Set()

let handler = async (m, { conn, isAdmin, isOwner, command }) => {

    // ==== SOLO FUNCIONA EN GRUPOS ====
    if (!m.isGroup) return

    // ==== SOLO ADMINS / OWNERS PARA LOS COMANDOS ====
    if (["mute", "unmute"].includes(command)) {

        if (!isAdmin && !isOwner) return

        // ==== OBTENER USUARIO ====
        let who = m.mentionedJid?.[0] || null
        if (!who)
            return m.reply("⚠️ Debes mencionar a un usuario.")

        // ==== PROTEGER DUEÑOS ====
        const owners = [
            "59896026646@s.whatsapp.net",
            "59898719147@s.whatsapp.net"
        ]
        if (owners.includes(who))
            return m.reply("❌ No puedes mutear/desmutear a un *owner*.")

        // ==== TAG CLICKEABLE ====
        let number = who.split("@")[0]
        let mentionTag = "@" + number

        // ==== COMANDO MUTE ====
        if (command === "mute") {
            mutedUsers.add(who)
            return await conn.sendMessage(m.chat, {
                text: `🔇 *Usuario muteado:* ${mentionTag}`,
                mentions: [who]
            })
        }

        // ==== COMANDO UNMUTE ====
        if (command === "unmute") {
            if (!mutedUsers.has(who))
                return m.reply("⚠️ Ese usuario no estaba muteado.")

            mutedUsers.delete(who)

            return await conn.sendMessage(m.chat, {
                text: `🔊 *Usuario desmuteado:* ${mentionTag}`,
                mentions: [who]
            })
        }
    }

}

// =========================================================
// 🔥 ESTA ES LA PARTE QUE FALTABA: AUTO-DELETE REAL
// =========================================================
handler.all = async function (m, { conn }) {

    // Si el usuario está muteado, borrar su mensaje
    if (mutedUsers.has(m.sender)) {
        try {
            await conn.sendMessage(m.chat, { delete: m.key })
        } catch {}
    }

}

handler.help = ["mute @usuario", "unmute @usuario"]
handler.tags = ["group"]
handler.command = ["mute", "unmute"]
handler.group = true
handler.admin = true

export default handler
