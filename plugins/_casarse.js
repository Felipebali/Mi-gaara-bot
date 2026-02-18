let handler = async (m, { conn }) => {

  const getUser = (jid) => {
    if (!global.db.data.users[jid]) {
      global.db.data.users[jid] = {
        pareja: null,
        estado: 'soltero',
        propuesta: null,
        relacionFecha: null,
        matrimonioFecha: null,
        amor: 0
      }
    }
    return global.db.data.users[jid]
  }

  const sender = m.sender
  const user = getUser(sender)

  // Verificar pareja
  if (!user.pareja)
    return m.reply('❌ No tenés pareja.')

  const parejaJid = user.pareja
  const parejaUser = getUser(parejaJid)

  // Verificar estado
  if (user.estado !== 'novios')
    return m.reply('❌ Solo los novios pueden casarse.')

  // Verificar tiempo mínimo (7 días)
  if (!user.relacionFecha)
    return m.reply('❌ Error en la relación.')

  const ahora = Date.now()
  const dias = Math.floor((ahora - user.relacionFecha) / 86400000)

  if (dias < 7)
    return m.reply(
      `⏳ Deben esperar 7 días para casarse.\n\nFaltan: ${7 - dias} día(s)`
    )

  // Casar
  user.estado = 'casados'
  parejaUser.estado = 'casados'

  user.matrimonioFecha = ahora
  parejaUser.matrimonioFecha = ahora

  await conn.reply(
    m.chat,
    `💍 *¡BODA CONFIRMADA!*

👰 @${sender.split('@')[0]}
🤵 @${parejaJid.split('@')[0]}

Ahora están oficialmente:

💖 *CASADOS*

Que viva el amor 🥂✨`,
    m,
    { mentions: [sender, parejaJid] }
  )
}

handler.command = ['casarse']

export default handler
