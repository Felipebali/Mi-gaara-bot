// 📂 plugins/parejas.js — Sistema de Parejas FelixCat ❤️💍

let handler = async (m, { conn, command }) => {

  const db = global.db.data
  if (!db.users) db.users = {}

  const sender = m.sender
  const getUser = (id) => {
    if (!db.users[id]) {
      db.users[id] = {
        pareja: null,
        estado: 'soltero',
        propuesta: null,
        propuestaFecha: null,
        relacionFecha: null,
        matrimonioFecha: null,
        amor: 0
      }
    }
    return db.users[id]
  }

  const user = getUser(sender)

  const getTarget = () => {
    if (m.mentionedJid?.length) return m.mentionedJid[0]
    if (m.quoted?.sender) return m.quoted.sender
    return null
  }

  const ahora = Date.now()

  // ========================
  // 💌 PROPUESTA
  // ========================

  if (command === 'pareja') {

    const target = getTarget()
    if (!target) return m.reply('💌 Menciona a la persona.')

    if (target === sender)
      return m.reply('🤨 No puedes proponerte a ti mismo.')

    const tu = getUser(target)

    if (user.estado !== 'soltero')
      return m.reply('❌ Ya tienes una relación.')

    if (tu.estado !== 'soltero')
      return m.reply('❌ Esa persona ya tiene pareja.')

    tu.propuesta = sender
    tu.propuestaFecha = ahora

    return conn.reply(
      m.chat,
      `💖 @${sender.split('@')[0]} quiere ser tu pareja\n\nResponde con:\n.aceptar o .rechazar`,
      m,
      { mentions: [sender] }
    )
  }

  // ========================
  // ✅ ACEPTAR
  // ========================

  if (command === 'aceptar') {

    if (!user.propuesta)
      return m.reply('❌ No tienes propuestas.')

    const proposer = user.propuesta
    const tu = getUser(proposer)

    user.estado = 'novios'
    tu.estado = 'novios'

    user.pareja = proposer
    tu.pareja = sender

    user.relacionFecha = ahora
    tu.relacionFecha = ahora

    user.propuesta = null
    user.propuestaFecha = null

    return conn.reply(
      m.chat,
      `💞 Ahora son pareja\n@${sender.split('@')[0]} ❤️ @${proposer.split('@')[0]}`,
      m,
      { mentions: [sender, proposer] }
    )
  }

  // ========================
  // ❌ RECHAZAR
  // ========================

  if (command === 'rechazar') {

    if (!user.propuesta)
      return m.reply('❌ No tienes propuestas.')

    const proposer = user.propuesta

    user.propuesta = null
    user.propuestaFecha = null

    return conn.reply(
      m.chat,
      `💔 Rechazaste la propuesta de @${proposer.split('@')[0]}`,
      m,
      { mentions: [proposer] }
    )
  }

  // ========================
  // 💔 TERMINAR
  // ========================

  if (command === 'terminar') {

    if (!user.pareja)
      return m.reply('❌ No tienes pareja.')

    const pareja = getUser(user.pareja)

    pareja.pareja = null
    pareja.estado = 'soltero'
    pareja.relacionFecha = null
    pareja.matrimonioFecha = null

    const ex = user.pareja

    user.pareja = null
    user.estado = 'soltero'
    user.relacionFecha = null
    user.matrimonioFecha = null

    return conn.reply(
      m.chat,
      `💔 Relación terminada\n@${sender.split('@')[0]} y @${ex.split('@')[0]}`,
      m,
      { mentions: [sender, ex] }
    )
  }

  // ========================
  // 💍 CASARSE
  // ========================

  if (command === 'casar') {

    if (!user.pareja)
      return m.reply('❌ No tienes pareja.')

    if (user.estado === 'casados')
      return m.reply('💍 Ya están casados.')

    const diasRelacion = (ahora - user.relacionFecha) / 86400000

    if (diasRelacion < 7)
      return m.reply('⏳ Deben esperar 7 días de relación.')

    const pareja = getUser(user.pareja)

    user.estado = 'casados'
    pareja.estado = 'casados'

    user.matrimonioFecha = ahora
    pareja.matrimonioFecha = ahora

    return conn.reply(
      m.chat,
      `💍 ¡Se casaron!\n@${sender.split('@')[0]} ❤️ @${user.pareja.split('@')[0]}`,
      m,
      { mentions: [sender, user.pareja] }
    )
  }

  // ========================
  // ⚖️ DIVORCIO
  // ========================

  if (command === 'divorciar') {

    if (user.estado !== 'casados')
      return m.reply('❌ No estás casado.')

    const pareja = getUser(user.pareja)
    const ex = user.pareja

    pareja.pareja = null
    pareja.estado = 'soltero'
    pareja.matrimonioFecha = null
    pareja.relacionFecha = null

    user.pareja = null
    user.estado = 'soltero'
    user.matrimonioFecha = null
    user.relacionFecha = null

    return conn.reply(
      m.chat,
      `⚖️ Divorcio realizado\n@${sender.split('@')[0]} 💔 @${ex.split('@')[0]}`,
      m,
      { mentions: [sender, ex] }
    )
  }

  // ========================
  // ❤️ AMOR
  // ========================

  if (command === 'amor') {

    if (!user.pareja)
      return m.reply('❌ No tienes pareja.')

    user.amor = (user.amor || 0) + 10

    return m.reply(`❤️ Amor aumentado\nNivel: ${user.amor}`)
  }

  // ========================
  // 📊 RELACION
  // ========================

  if (command === 'relacion') {

    if (!user.pareja)
      return m.reply('❌ Estás soltero.')

    const pareja = user.pareja
    const estado = user.estado

    const dias = Math.floor((ahora - user.relacionFecha) / 86400000)

    let txt = `
💑 RELACIÓN

👤 Tú: @${sender.split('@')[0]}
❤️ Pareja: @${pareja.split('@')[0]}

💞 Estado: ${estado}
📅 Días juntos: ${dias}
❤️ Amor: ${user.amor || 0}
`.trim()

    return conn.reply(
      m.chat,
      txt,
      m,
      { mentions: [sender, pareja] }
    )
  }

}

handler.command = [
  'pareja',
  'aceptar',
  'rechazar',
  'terminar',
  'casar',
  'divorciar',
  'relacion',
  'amor'
]

export default handler
