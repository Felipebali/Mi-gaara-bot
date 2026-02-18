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
    return m.reply('❌ No estás casado.')

  const parejaJid = user.pareja
  const parejaUser = getUser(parejaJid)

  // Verificar estado
  if (user.estado !== 'casados')
    return m.reply('❌ Solo los casados pueden divorciarse.')

  // Reset relación
  user.pareja = null
  parejaUser.pareja = null

  user.estado = 'soltero'
  parejaUser.estado = 'soltero'

  user.relacionFecha = null
  parejaUser.relacionFecha = null

  user.matrimonioFecha = null
  parejaUser.matrimonioFecha = null

  await conn.reply(
    m.chat,
    `💔 *DIVORCIO CONFIRMADO*

👤 @${sender.split('@')[0]}
👤 @${parejaJid.split('@')[0]}

El matrimonio ha terminado...

Ahora están solteros nuevamente 🥀`,
    m,
    { mentions: [sender, parejaJid] }
  )
}

handler.command = ['divorcio']

export default handler
