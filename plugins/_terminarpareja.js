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

  // Verificar si tiene pareja
  if (!user.pareja)
    return m.reply('❌ No tenés pareja actualmente.')

  const parejaJid = user.pareja
  const parejaUser = getUser(parejaJid)

  // Limpiar datos
  user.pareja = null
  user.estado = 'soltero'
  user.relacionFecha = null
  user.matrimonioFecha = null
  user.amor = 0

  if (parejaUser) {
    parejaUser.pareja = null
    parejaUser.estado = 'soltero'
    parejaUser.relacionFecha = null
    parejaUser.matrimonioFecha = null
    parejaUser.amor = 0
  }

  await conn.reply(
    m.chat,
    `💔 *RELACIÓN TERMINADA*

👤 @${sender.split('@')[0]}
y
👤 @${parejaJid.split('@')[0]}

ya no están juntos...

El amor fue real 🥀`,
    m,
    { mentions: [sender, parejaJid] }
  )
}

handler.command = ['terminar']

export default handler
