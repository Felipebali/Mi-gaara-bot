// 📂 plugins/grupos-mute.js — FelixCat_Bot 🐾
// Mute + Unmute + Auto-delete compatible con Gaara-Ultra-MD

global.mutedUsers = global.mutedUsers || {}

const owners = [
    "59896026646@s.whatsapp.net",
    "59898719147@s.whatsapp.net"
]

let handler = async (m, { conn, participants, isAdmin, isOwner, command }) => {

    if (!m.isGroup) return

    const chatId = m.chat
    if (!global.mutedUsers[chatId]) global.mutedUsers[chatId] = new Set()

    // =====================================
    // 🧹 AUTO BORRADO
    // =====================================
    if (!/^(mute|unmute)$/i.test(command)) {
        if (global.mutedUsers[chatId].has(m.sender)) {
            try {
                await conn.sendMessage(chatId, { delete: m.key })
            } catch { }
        }
        return
    }

    // =====================================
    // 🔐 SOLO ADMINS / DUEÑOS
    // =====================================
    if (!isAdmin && !isOwner)
        return m.reply("❌ Solo administradores o dueños pueden usar este comando.")

    // =====================================
    // 🎯 OBTENER USUARIO
    // =====================================
    let user = null

    // 1️⃣ si se respondió a un mensaje
    if (m.quoted) user = m.quoted.sender

    // 2️⃣ si existen mentionedJid
    if (!user && m.mentionedJid?.length)
        user = m.mentionedJid[0]

    // 3️⃣ extendedTextMessage.contextInfo
    if (!user && m.message?.extendedTextMessage?.contextInfo?.mentionedJid)
        user = m.message.extendedTextMessage.contextInfo.mentionedJid[0]

    // 4️⃣ fallback: detectar @numero
    if (!user) {
        const match = m.text.match(/@(\d{5,20})/)
        if (match) user = match[1] + "@s.whatsapp.net"
    }

    if (!user)
        return m.reply("❌ Menciona o responde al usuario que querés mutear/desmutear.")

    // Asegurar formato JID válido
    if (!user.endsWith("@s.whatsapp.net") && !user.endsWith("@g.us"))
        user = user.replace(/[^0-9]/g, "") + "@s.whatsapp.net"

    // =====================================
    // 🚫 VERIFICAR NO ADMIN / NO OWNER
    // =====================================
    const groupAdmins = participants.filter(p => p.admin)
    const isTargetAdmin = groupAdmins.some(a => a.id === user)

    if (owners.includes(user))
        return m.reply("❌ No puedo mutear a un dueño del bot.")

    if (isTargetAdmin)
        return m.reply("❌ No puedo mutear a un administrador del grupo.")

    // =====================================
    // 🔇 MUTE
    // =====================================
    if (/^mute$/i.test(command)) {

        global.mutedUsers[chatId].add(user)

        return conn.sendMessage(chatId, {
            text: `🔇 *Usuario muteado:* @${user.split("@")[0]}`,
            mentions: [user]
        })
    }

    // =====================================
    // 🔊 UNMUTE
    // =====================================
    if (/^unmute$/i.test(command)) {

        global.mutedUsers[chatId].delete(user)

        return conn.sendMessage(chatId, {
            text: `🔊 *Usuario desmuteado:* @${user.split("@")[0]}`,
            mentions: [user]
        })
    }

}

handler.command = /^(mute|unmute)$/i
handler.help = ["mute @user", "unmute @user"]
handler.tags = ["group"]

export default handler
