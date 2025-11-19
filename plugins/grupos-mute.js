// 📂 plugins/mute-unmute.js — FelixCat_Bot 🐾
// TODO en un solo plugin: mute, unmute y borrado automático

// Estructura global
global.mutedUsers = global.mutedUsers || {}

const owners = [
    "59896026646@s.whatsapp.net",
    "59898719147@s.whatsapp.net"
]

let handler = async (m, { conn, participants, isAdmin, isOwner, command }) => {

    if (!m.isGroup) return

    let chatId = m.chat

    // Crear espacio si no existe
    if (!global.mutedUsers[chatId]) global.mutedUsers[chatId] = new Set()

    // -------------------------------
    // 🧹 AUTODELETE si el usuario está muteado
    // -------------------------------
    if (!["mute", "unmute"].includes(command)) {
        if (global.mutedUsers[chatId].has(m.sender)) {
            try {
                await conn.sendMessage(chatId, { delete: m.key })
            } catch (e) {
                console.log("❌ Error borrando mensaje muteado:", e)
            }
        }
        return
    }

    // -------------------------------
    // 🛑 SOLO ADMINS O DUEÑOS PUEDEN USAR COMANDOS
    // -------------------------------
    if (!isAdmin && !isOwner)
        return m.reply("❌ Solo administradores o dueños pueden usar este comando.")

    // -------------------------------
    // 🎯 OBTENER USUARIO POR RESPUESTA O MENCIÓN
    // -------------------------------
    let user

    if (m.quoted) {
        user = m.quoted.sender
    } else if (m.mentionedJid?.length) {
        user = m.mentionedJid[0]
    } else {
        return m.reply("❌ Menciona o responde al mensaje del usuario.")
    }

    // -------------------------------
    // 🚫 NO PERMITIR MUTEAR DUEÑOS O ADMINS
    // -------------------------------
    const groupAdmins = participants.filter(p => p.admin)
    const isTargetAdmin = groupAdmins.some(a => a.id === user)

    if (owners.includes(user)) {
        return m.reply("❌ No puedo mutear a un dueño del bot.")
    }

    if (isTargetAdmin) {
        return m.reply("❌ No puedo mutear a un administrador del grupo.")
    }

    // -------------------------------
    // 🔇 MUTE
    // -------------------------------
    if (command === "mute") {

        global.mutedUsers[chatId].add(user)

        return m.reply(
            `🔇 *Usuario muteado:* @${user.split("@")[0]}`,
            { mentions: [user] }
        )
    }

    // -------------------------------
    // 🔊 UNMUTE
    // -------------------------------
    if (command === "unmute") {

        global.mutedUsers[chatId].delete(user)

        return m.reply(
            `🔊 *Usuario desmuteado:* @${user.split("@")[0]}`,
            { mentions: [user] }
        )
    }

}

handler.command = /^(mute|unmute)$/i
handler.tags = ["group"]
handler.help = ["mute @user", "unmute @user"]

export default handler
