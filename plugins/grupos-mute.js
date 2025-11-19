// 📂 plugins/grupos-mute.js — FelixCat_Bot 🐾
// Mute + Unmute + Auto-delete usando siempre who.split("@")[0]

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
    // 🧹 AUTO BORRADO PARA MUTEADOS
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
    // 🎯 DETECTAR USUARIO
    // =====================================
    let who = null

    if (m.quoted) who = m.quoted.sender
    if (!who && m.mentionedJid?.length) who = m.mentionedJid[0]
    if (!who && m.message?.extendedTextMessage?.contextInfo?.mentionedJid)
        who = m.message.extendedTextMessage.contextInfo.mentionedJid[0]

    if (!who) {
        const match = m.text.match(/@(\d{5,20})/)
        if (match) who = match[1] + "@s.whatsapp.net"
    }

    if (!who) return m.reply("❌ Menciona o responde al usuario.")

    // Convertir a JID válido si viene crudo
    if (!who.endsWith("@s.whatsapp.net") && !who.endsWith("@g.us"))
        who = who.replace(/[^0-9]/g, "") + "@s.whatsapp.net"

    // =====================================
    // 🛑 EVITAR MUTEAR ADMINS / OWNERS
    // =====================================
    const groupAdmins = participants.filter(p => p.admin)
    const isTargetAdmin = groupAdmins.some(a => a.id === who)

    if (owners.includes(who))
        return m.reply("❌ No puedo mutear a un dueño.")

    if (isTargetAdmin)
        return m.reply("❌ No puedo mutear a un administrador del grupo.")

    // =====================================
    // 🔇 MUTE
    // =====================================
    if (/^mute$/i.test(command)) {

        global.mutedUsers[chatId].add(who)

        return conn.sendMessage(chatId, {
            text: `🔇 *Usuario muteado:* @${who.split("@")[0]}`,
            mentions: [who]
        })
    }

    // =====================================
    // 🔊 UNMUTE
    // =====================================
    if (/^unmute$/i.test(command)) {

        global.mutedUsers[chatId].delete(who)

        return conn.sendMessage(chatId, {
            text: `🔊 *Usuario desmuteado:* @${who.split("@")[0]}`,
            mentions: [who]
        })
    }
}

handler.command = /^(mute|unmute)$/i
handler.help = ["mute @user", "unmute @user"]
handler.tags = ["group"]

export default handler
