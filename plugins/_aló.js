function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const INTERVAL = 3500 // 3,5 segundos

const handler = async (m, { conn, isAdmin }) => {
  const emoji = '🔪'
  const sender = m.sender.replace(/\D/g, '')

  const ownersBot = ['59898719147', '59896026646', '59892363485']

  // 📌 Obtener metadata del grupo
  let groupInfo
  try {
    groupInfo = await conn.groupMetadata(m.chat)
  } catch {
    return conn.reply(m.chat, '❌ No se pudo obtener información del grupo.', m)
  }

  const ownerGroup = groupInfo.owner ? groupInfo.owner.replace(/\D/g, '') : null
  const botJid = conn.user.jid.replace(/\D/g, '')

  const protectedList = [...ownersBot, ownerGroup, botJid].filter(Boolean)

  // 🔐 Permisos
  if (!isAdmin && !ownersBot.includes(sender) && sender !== ownerGroup) {
    return conn.reply(
      m.chat,
      '❌ Solo admins, el dueño del grupo o los dueños del bot pueden usar este comando.',
      m
    )
  }

  // 👥 Filtrar participantes expulsables
  const participants = groupInfo.participants
    .map(p => p.id)
    .filter(jid => {
      const num = jid.replace(/\D/g, '')
      return !protectedList.includes(num)
    })

  if (!participants.length) {
    return conn.reply(m.chat, '😅 No hay usuarios para expulsar.', m)
  }

  // 🔪 Kick uno por uno
  for (const user of participants) {
    try {
      await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
      try { await m.react(emoji) } catch {}
      await sleep(INTERVAL)
    } catch (e) {
      console.log('Error expulsando:', user, e)
    }
  }
}

handler.help = ['kickall']
handler.tags = ['grupo']
handler.command = ['kickall', 'kall', 'banall']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
