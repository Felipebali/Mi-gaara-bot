const handler = async (m, { conn, text, command }) => {
    if (!m.isGroup) return conn.reply(m.chat, '❌ Este comando solo funciona en grupos.', m)

    // Obtener administradores del grupo de forma segura
    const metadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!metadata || !metadata.participants) return conn.reply(m.chat, '❌ No se pudo obtener la lista de participantes.', m)

    const participants = metadata.participants

    function isAdminJid(jid) {
        const p = participants.find(p => p.id === jid || p.jid === jid)
        return p && (p.admin === 'admin' || p.admin === 'superadmin')
    }

    const isAdmin = isAdminJid(m.sender)
    const botAdmin = isAdminJid(conn.user.jid)

    if (!isAdmin) return conn.reply(m.chat, '❌ Debes ser admin para usar este comando.', m)
    if (!botAdmin) return conn.reply(m.chat, '❌ El bot debe ser admin para ejecutar esta acción.', m)

    // Determinar quién silenciar/desilenciar
    let who
    const numberRegex = /@[0-9]+/g
    const numberMatches = text ? text.match(numberRegex) : null
    if (numberMatches && numberMatches.length > 0) {
        who = numberMatches[0].replace("@", "") + "@s.whatsapp.net"
    } else {
        who = (m.mentionedJid && m.mentionedJid[0]) || (m.quoted ? m.quoted.sender : null)
    }

    if (!who) return conn.reply(m.chat, `❌ Por favor, menciona, cita o escribe el número del usuario a ${command}`, m)
    if (who === conn.user.jid) return conn.reply(m.chat, `❌ No puedes ${command} al bot.`, m)

    // No afectar a owners del bot
    const ownerJids = Array.isArray(globalThis.owners) ? globalThis.owners.map(o => o + "@s.whatsapp.net") : []
    if (ownerJids.includes(who)) return m.react("❌")

    // Obtener datos del usuario desde la base de datos global de forma segura
    if (!global.db.data) global.db.data = {}
    if (!global.db.data.users) global.db.data.users = {}
    if (!global.db.data.users[who]) global.db.data.users[who] = { inGroup: {} }

    const userData = global.db.data.users[who]
    if (!userData.inGroup) userData.inGroup = {}

    const mute = ["silenciar", "mute", "silencio", "hacesilencio"].includes(command)

    // Actualizar estado mute en el grupo
    if (!userData.inGroup[m.chat]) userData.inGroup[m.chat] = {}
    userData.inGroup[m.chat].mute = mute

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
