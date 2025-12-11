import { getUser, updateUser } from '../databaseFunctions.js'

const handler = async (m, { conn, text, command }) => {
    if (!m.isGroup) return conn.reply(m.chat, '❌ Este comando solo funciona en grupos.', m)

    // Obtener administradores del grupo
    const metadata = await conn.groupMetadata(m.chat)
    const participants = metadata.participants
    const admins = participants.filter(p => p.admin || p.admin === 'superadmin').map(p => p.id)

    const botAdmin = admins.includes(conn.user.jid)
    const isAdmin = admins.includes(m.sender)

    if (!isAdmin) return conn.reply(m.chat, '❌ Debes ser admin para usar este comando.', m)
    if (!botAdmin) return conn.reply(m.chat, '❌ El bot debe ser admin para ejecutar esta acción.', m)

    // Determinar quién silenciar/desilenciar
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

    // No afectar a owners del bot
    const ownerJids = globalThis.owners.map(o => o + "@s.whatsapp.net")
    if (ownerJids.includes(who)) return m.react("❌")

    const whoData = getUser(who)
    if (!whoData) return conn.reply(m.chat, '❌ No hay datos de este usuario. Puede que aún no haya enviado mensajes.', m)

    const mute = ["silenciar", "mute", "silencio", "hacesilencio"].includes(command)

    const updateInGroup = {
        ...whoData.inGroup,
        [m.chat]: {
            ...whoData.inGroup[m.chat],
            mute: mute,
        },
    }

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
