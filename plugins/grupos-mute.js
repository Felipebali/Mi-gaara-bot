// 📂 plugins/mute-unmute.js — FelixCat_Bot 🐾
// Mute + Unmute + Auto-delete en un solo plugin

global.mutedUsers = global.mutedUsers || {}

const owners = [
    "59896026646@s.whatsapp.net",
    "59898719147@s.whatsapp.net"
]

let handler = async (m, { conn, participants, isAdmin, isOwner, command }) => {

    if (!m.isGroup) return

    let chatId = m.chat
    if (!global.mutedUsers[chatId]) global.mutedUsers[chatId] = new Set()

    // ================================
    // 🧹 AUTODELETE cuando está muteado
    // ================================
    if (!["mute", "unmute"].includes(command)) {
        if (global.mutedUsers[chatId].has(m.sender)) {
            try {
                await conn.sendMessage(chatId, { delete: m.key })
            } catch (e) {}
        }
        return
    }

    // ================================
    // 🔐 Solo admin / dueño
    // ================================
    if (!isAdmin && !isOwner)
        return m.reply("❌ Solo administradores o dueños pueden usar este comando.")

    // ================================
    // 🎯 Detectar usuario correctamente
    // ================================
    let user = null

    // 1️⃣ si respondió un mensaje
    if (m.quoted) {
        user = m.quoted.sender
    }

    // 2️⃣ si hay mención real de WhatsApp
    if (!user && m.mentionedJid?.length) {
        user = m.mentionedJid[0]
    }

    // 3️⃣ detectar menciones en extendedTextMessage (Gaara / Hoshino)
    if (!user && m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
        user = m.message.extendedTextMessage.contextInfo.mentionedJid[0]
    }

    // 4️⃣ fallback: detectar texto tipo "@123456"
    if (!user) {
        let match = m.text.match(/@(\d{5,20})/)
        if (match) user = match[1] + "@s.whatsapp.net"
    }

    if (!user)
        return m.reply("❌ Menciona o responde al usuario.")

    // ================================
    // 🚫 evitar dueños y admins
    // ================================
    const groupAdmins = participants.filter(p => p.admin)
    const isTargetAdmin = groupAdmins.some(a => a.id === user)

    if (owners.includes(user)) return m.reply("❌ No puedo mutear a un dueño.")
    if (isTargetAdmin) return m.reply("❌ No puedo mutear a un administrador.")

    // ================================
    // 🔇 MUTEAR
    // ================================
    if (command === "mute") {
        global.mutedUsers[chatId].add(user)
        return m.reply(`🔇 Usuario muteado: @${user.split("@")[0]}`, {
            mentions: [user]
        })
    }

    // ================================
    // 🔊 DESMUTEAR
    // ================================
    if (command === "unmute") {
        global.mutedUsers[chatId].delete(user)
        return m.reply(`🔊 Usuario desmuteado: @${user.split("@")[0]}`, {
            mentions: [user]
        })
    }
}

handler.command = /^(mute|unmute)$/i
handler.help = ["mute @user", "unmute @user"]
handler.tags = ["group"]

export default handler
