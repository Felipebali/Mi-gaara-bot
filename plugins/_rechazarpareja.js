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

  // Verificar propuesta
  if (!user.propuesta)
    return m.reply('❌ No tenés ninguna propuesta para rechazar.')

  const from = user.propuesta.from

  // Limpiar propuesta
  user.propuesta = null

  await conn.reply(
    m.chat,
    `💔 *PROPUESTA RECHAZADA*

👤 @${sender.split('@')[0]}
❌ rechazó la propuesta de
👤 @${from.split('@')[0]}

Tal vez en otra vida 😔`,
    m,
    { mentions: [sender, from] }
  )
}

handler.command = ['rechazar']

export default handler
