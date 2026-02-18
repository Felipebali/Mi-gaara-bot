import fs from 'fs'
import path from 'path'

const dir = './database'
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const file = path.join(dir, 'parejas.json')
if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({}, null, 2))

const loadDB = () => JSON.parse(fs.readFileSync(file))
const saveDB = (data) => fs.writeFileSync(file, JSON.stringify(data, null, 2))

let handler = async (m, { conn, command }) => {

  let db = loadDB()
  const sender = m.sender
  const ahora = Date.now()

  const getUser = (id) => {
    if (!db[id]) {
      db[id] = {
        pareja: null,
        estado: 'soltero',
        propuesta: null,
        propuestaFecha: null,
        relacionFecha: null,
        matrimonioFecha: null,
        amor: 0
      }
    }
    return db[id]
  }

  const getTarget = () => {
    if (m.mentionedJid?.length) return m.mentionedJid[0]
    if (m.quoted?.sender) return m.quoted.sender
    return null
  }

  const tag = (id) => '@' + id.split('@')[0]

  // 💌 PROPUESTA
  if (command === 'pareja') {

    const target = getTarget()
    if (!target) return m.reply('💌 Debes mencionar o responder al mensaje de la persona que te gusta.')

    if (target === sender)
      return m.reply('❌ No puedes enamorarte de ti mismo… aunque te quieras mucho 😆')

    const user = getUser(sender)
    const tu = getUser(target)

    if (user.estado !== 'soltero')
      return m.reply('💔 Ya tienes una relación activa.')

    if (tu.estado !== 'soltero')
      return m.reply('💔 Esa persona ya tiene pareja.')

    tu.propuesta = sender
    tu.propuestaFecha = ahora

    saveDB(db)

    return conn.reply(
      m.chat,
      `💖 *¡Propuesta de Amor!* 💖

${tag(sender)} quiere comenzar una hermosa relación con ${tag(target)} ❤️

✨ Responde con:
👉 *.aceptar* para aceptar
👉 *.rechazar* para rechazar

El destino está en tus manos...`,
      m,
      { mentions: [sender, target] }
    )
  }

  // ✅ ACEPTAR
  if (command === 'aceptar') {

    const user = getUser(sender)
    if (!user.propuesta)
      return m.reply('❌ No tienes propuestas pendientes.')

    const proposer = user.propuesta
    const proposerUser = getUser(proposer)

    user.estado = 'novios'
    proposerUser.estado = 'novios'

    user.pareja = proposer
    proposerUser.pareja = sender

    user.relacionFecha = ahora
    proposerUser.relacionFecha = ahora

    user.propuesta = null
    user.propuestaFecha = null

    saveDB(db)

    return conn.reply(
      m.chat,
      `💞 *¡El amor ha triunfado!* 💞

${tag(sender)} ❤️ ${tag(proposer)}

Desde ahora sus corazones laten juntos 💓
¡Que viva la pareja! 🥰`,
      m,
      { mentions: [sender, proposer] }
    )
  }

  // ❌ RECHAZAR
  if (command === 'rechazar') {

    const user = getUser(sender)
    if (!user.propuesta)
      return m.reply('❌ No tienes propuestas pendientes.')

    const proposer = user.propuesta

    user.propuesta = null
    user.propuestaFecha = null

    saveDB(db)

    return conn.reply(
      m.chat,
      `💔 *Amor no correspondido...*

${tag(sender)} rechazó la propuesta de ${tag(proposer)} 😢

A veces el corazón toma otros caminos...`,
      m,
      { mentions: [sender, proposer] }
    )
  }

  // 💔 TERMINAR
  if (command === 'terminar') {

    const user = getUser(sender)
    if (!user.pareja)
      return m.reply('❌ No tienes pareja.')

    const parejaID = user.pareja
    const pareja = getUser(parejaID)

    pareja.pareja = null
    pareja.estado = 'soltero'
    pareja.relacionFecha = null
    pareja.matrimonioFecha = null

    user.pareja = null
    user.estado = 'soltero'
    user.relacionFecha = null
    user.matrimonioFecha = null

    saveDB(db)

    return conn.reply(
      m.chat,
      `💔 *Relación finalizada*

${tag(sender)} 💔 ${tag(parejaID)}

Los caminos se separan...
pero siempre quedan los recuerdos.`,
      m,
      { mentions: [sender, parejaID] }
    )
  }

  // 💍 CASAR
  if (command === 'casar') {

    const user = getUser(sender)
    if (!user.pareja)
      return m.reply('❌ No tienes pareja.')

    if (user.estado === 'casados')
      return m.reply('💍 Ya están casados.')

    const diasRelacion = (ahora - user.relacionFecha) / 86400000
    if (diasRelacion < 7)
      return m.reply('⏳ Deben esperar al menos 7 días de relación para casarse.')

    const pareja = getUser(user.pareja)

    user.estado = 'casados'
    pareja.estado = 'casados'

    user.matrimonioFecha = ahora
    pareja.matrimonioFecha = ahora

    saveDB(db)

    return conn.reply(
      m.chat,
      `💍 *¡BODA CONFIRMADA!* 💍

${tag(sender)} 💖 ${tag(user.pareja)}

Hoy unen sus vidas en matrimonio 💒
¡Que sean muy felices! 🥂`,
      m,
      { mentions: [sender, user.pareja] }
    )
  }

  // ⚖️ DIVORCIO
  if (command === 'divorciar') {

    const user = getUser(sender)
    if (user.estado !== 'casados')
      return m.reply('❌ No estás casado.')

    const parejaID = user.pareja
    const pareja = getUser(parejaID)

    pareja.pareja = null
    pareja.estado = 'soltero'
    user.pareja = null
    user.estado = 'soltero'

    saveDB(db)

    return conn.reply(
      m.chat,
      `⚖️ *Divorcio realizado*

${tag(sender)} 💔 ${tag(parejaID)}

El matrimonio ha llegado a su fin.`,
      m,
      { mentions: [sender, parejaID] }
    )
  }

  // ❤️ AMOR
  if (command === 'amor') {

    const user = getUser(sender)
    if (!user.pareja)
      return m.reply('❌ No tienes pareja.')

    user.amor += 10
    saveDB(db)

    return conn.reply(
      m.chat,
      `❤️ *Amor aumentado*

${tag(sender)} 💕 ${tag(user.pareja)}

Nivel de amor: *${user.amor}* 💖`,
      m,
      { mentions: [sender, user.pareja] }
    )
  }

  // 📊 RELACION
  if (command === 'relacion') {

    const user = getUser(sender)
    if (!user.pareja)
      return m.reply('❌ Estás soltero.')

    const parejaID = user.pareja
    const dias = Math.floor((ahora - user.relacionFecha) / 86400000)

    return conn.reply(
      m.chat,
      `💑 *Estado de la Relación*

${tag(sender)} ❤️ ${tag(parejaID)}

💞 Estado: *${user.estado}*
📅 Tiempo juntos: *${dias} días*
❤️ Nivel de amor: *${user.amor}*`,
      m,
      { mentions: [sender, parejaID] }
    )
  }

  // 🧹 CLEARSHIP
  if (command === 'clearship') {

    const target = getTarget() || sender
    const user = getUser(target)

    if (!user.pareja)
      return m.reply('❌ No hay relación para borrar.')

    const parejaID = user.pareja
    const pareja = getUser(parejaID)

    pareja.pareja = null
    pareja.estado = 'soltero'
    pareja.relacionFecha = null
    pareja.matrimonioFecha = null
    pareja.propuesta = null

    user.pareja = null
    user.estado = 'soltero'
    user.relacionFecha = null
    user.matrimonioFecha = null
    user.propuesta = null

    saveDB(db)

    return conn.reply(
      m.chat,
      `🧹 *Relación eliminada*

${tag(target)} 💔 ${tag(parejaID)}

Los registros fueron borrados.`,
      m,
      { mentions: [target, parejaID] }
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
  'amor',
  'clearship'
]

export default handler
