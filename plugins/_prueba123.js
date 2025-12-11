const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!m.isGroup) return conn.reply(m.chat, '❌ Este comando solo funciona en grupos.', m)
    if (!m.isAdmin && !m.isBotAdmin) return conn.reply(m.chat, '❌ Debes ser admin para usar este comando.', m)

    let who
    const numberRegex = /@[0-9]+/g
    const numberMatches = text ? text.match(numberRegex) : null
    if (numberMatches && numberMatches.length > 0) {
        who = numberMatches[0].replace("@", "") + "@s.whatsapp.net"
    } else {
        who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null
    }

    if (!who) return conn.reply(m.chat, `❌ Por favor, menciona, cita o escribe el número del usuario a ${command}`, m)
    if (who === conn.user.jid) return conn.reply(m.chat, `❌ No puedes ${command} al bot.`, m)

    // no afectar a owners del bot
    const ownerJids = globalThis.owners.map(o => o + "@s.whatsapp.net")
    if (ownerJids.includes(who)) return m.react("❌")

    // obtener datos del usuario
    const { getUser, updateUser } = await import('../databaseFunctions.js')
    const whoData = getUser(who)
    if (!whoData) return conn.reply(m.chat, '❌ No hay datos de este usuario. Puede que aún no haya enviado mensajes.', m)

    // determinar mute/unmute
    const mute = (command === "silenciar" || command === "mute" || command === "silencio" || command === "hacesilencio")

    const updateInGroup = {
        ...whoData.inGroup,
        [m.chat]: {
            ...whoData.inGroup[m.chat],
            mute: mute,
        },
    }

    // actualizar datos de usuario
    updateUser(who, { inGroup: JSON.stringify(updateInGroup) })

    await m.react("☑️")
    conn.reply(m.chat, `✅ Usuario ${await conn.getName(who)} ha sido ${mute ? "silenciado" : "desilenciado"} en este grupo.`, m)
}

handler.help = ['silenciar', 'mute', 'desilenciar', 'unmute', 'silencio', 'hacesilencio']
handler.tags = ['mods']
handler.command = ['silenciar', 'mute', 'desilenciar', 'unmute', 'silencio', 'hacesilencio']
handler.group = true
handler.botAdmin = true
handler.admin = true

export default handler
