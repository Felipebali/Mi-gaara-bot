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

  const formatTiempo = (ms) => {
    if (!ms) return 'No disponible'

    let dias = Math.floor(ms / 86400000)
    let horas = Math.floor(ms / 3600000) % 24

    return `${dias} días ${horas} horas`
  }

  // Soltero
  if (!user.pareja) {
    return m.reply(`💔 *ESTADO SENTIMENTAL*

👤 @${sender.split('@')[0]}
❤️ Estado: Soltero

Aún no tienes pareja.`,
    { mentions: [sender] })
  }

  const parejaJid = user.pareja
  const parejaUser = getUser(parejaJid)

  const ahora = Date.now()

  let tiempoRelacion = user.relacionFecha
    ? formatTiempo(ahora - user.relacionFecha)
    : 'No disponible'

  let tiempoMatrimonio = user.matrimonioFecha
    ? formatTiempo(ahora - user.matrimonioFecha)
    : null

  let estadoTexto = '❤️ Novios'
  if (user.estado === 'casados') estadoTexto = '💍 Casados'

  const txt = `
❤️ *ESTADO DE RELACIÓN*

👤 Usuario: @${sender.split('@')[0]}
💞 Pareja: @${parejaJid.split('@')[0]}

💖 Estado: ${estadoTexto}
🔥 Amor: ${user.amor || 0} puntos

⏳ Tiempo de relación: ${tiempoRelacion}
${tiempoMatrimonio ? `💍 Tiempo casados: ${tiempoMatrimonio}` : ''}

📅 Inicio relación: ${
  user.relacionFecha
    ? new Date(user.relacionFecha).toLocaleDateString()
    : 'No disponible'
}

${user.matrimonioFecha
  ? `💒 Matrimonio: ${new Date(user.matrimonioFecha).toLocaleDateString()}`
  : ''}

`.trim()

  await conn.reply(
    m.chat,
    txt,
    m,
    { mentions: [sender, parejaJid] }
  )
}

handler.command = ['relacion']

export default handler
