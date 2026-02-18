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

  // ==============================
  // 💌 PROPUESTA
  // ==============================
  if (command === 'pareja') {

    const target = getTarget()
    if (!target)
      return m.reply('💌 Debes mencionar o responder al mensaje de la persona que te gusta.')

    if (target === sender)
      return m.reply('😹 No puedes ser pareja contigo mismo.')

    const user = getUser(sender)
    const tu = getUser(target)

    // 🔥 si el que envía ya tiene pareja
    if (user.estado !== 'soltero') {
      return conn.reply(
        m.chat,
        `😡 *¡INFIEL DETECTADO!* 😡

${tag(sender)} intentó buscar otra pareja...

Pero ya está con ${tag(user.pareja)} 💔🔥

⚠️ Respeta tu relación.`,
        m,
        { mentions: [sender, user.pareja] }
      )
    }

    // 🔥 si la otra persona ya tiene pareja
    if (tu.estado !== 'soltero') {

      const parejaActual = tu.pareja

      return conn.reply(
        m.chat,
        `🚨 *¡DRAMA AMOROSO!* 🚨

${tag(sender)} intentó conquistar a ${tag(target)} 💘

Pero... ${tag(target)} ya está con ${tag(parejaActual)} 😳🔥

💞 El amor ya tiene dueño.`,
        m,
        { mentions: [sender, target, parejaActual] }
      )
    }

    tu.propuesta = sender
    tu.propuestaFecha = ahora

    saveDB(db)

    return conn.reply(
      m.chat,
      `💖 *¡Propuesta de Amor!* 💖

${tag(sender)} quiere estar con ${tag(target)} ❤️

✨ Responde:
👉 *.aceptar*
👉 *.rechazar*`,
      m,
      { mentions: [sender, target] }
    )
  }

  // ==============================
  // ✅ ACEPTAR
  // ==============================
  if (command === 'aceptar') {

    const user = getUser(sender)

    if (!user.propuesta)
      return m.reply('💭 No tienes propuestas pendientes.')

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
      `💞 *¡Relación iniciada!* 💞

${tag(sender)} ❤️ ${tag(proposer)}

Desde ahora están juntos 💓`,
      m,
      { mentions: [sender, proposer] }
    )
  }

  // ==============================
  // ❌ RECHAZAR
  // ==============================
  if (command === 'rechazar') {

    const user = getUser(sender)

    if (!user.propuesta)
      return m.reply('💭 No hay propuestas pendientes.')

    const proposer = user.propuesta

    user.propuesta = null
    user.propuestaFecha = null

    saveDB(db)

    return conn.reply(
      m.chat,
      `💔 ${tag(sender)} rechazó a ${tag(proposer)} 😢`,
      m,
      { mentions: [sender, proposer] }
    )
  }

  // ==============================
  // 💔 TERMINAR
  // ==============================
  if (command === 'terminar') {

    const user = getUser(sender)

    if (!user.pareja)
      return m.reply('💔 No tienes pareja.')

    const parejaID = user.pareja
    const pareja = getUser(parejaID)

    pareja.pareja = null
    pareja.estado = 'soltero'

    user.pareja = null
    user.estado = 'soltero'

    saveDB(db)

    return conn.reply(
      m.chat,
      `💔 *Relación terminada*

${tag(sender)} 💔 ${tag(parejaID)}`,
      m,
      { mentions: [sender, parejaID] }
    )
  }

  // ==============================
  // 💍 CASAR
  // ==============================
  if (command === 'casarse') {

    const user = getUser(sender)

    if (!user.pareja)
      return m.reply('💍 No tienes pareja.')

    if (user.estado === 'casados')
      return m.reply('💒 Ya están casados.')

    const diasRelacion = (ahora - user.relacionFecha) / 86400000

    if (diasRelacion < 7)
      return m.reply('⏳ Deben esperar 7 días de relación para casarse.')

    const pareja = getUser(user.pareja)

    user.estado = 'casados'
    pareja.estado = 'casados'

    user.matrimonioFecha = ahora
    pareja.matrimonioFecha = ahora

    saveDB(db)

    return conn.reply(
      m.chat,
      `💍 *¡BODA!* 💍

${tag(sender)} 💖 ${tag(user.pareja)}

Ahora están casados 💒`,
      m,
      { mentions: [sender, user.pareja] }
    )
  }

  // ==============================
  // ⚖️ DIVORCIO
  // ==============================
  if (command === 'divorciar') {

    const user = getUser(sender)

    if (user.estado !== 'casados')
      return m.reply('⚖️ No estás casado.')

    const parejaID = user.pareja
    const pareja = getUser(parejaID)

    pareja.pareja = null
    pareja.estado = 'soltero'

    user.pareja = null
    user.estado = 'soltero'

    saveDB(db)

    return conn.reply(
      m.chat,
      `⚖️ *Divorcio*

${tag(sender)} 💔 ${tag(parejaID)}`,
      m,
      { mentions: [sender, parejaID] }
    )
  }

  // ==============================
  // ❤️ AMOR
  // ==============================
  if (command === 'amor') {

    const user = getUser(sender)

    if (!user.pareja)
      return m.reply('❤️ No tienes pareja.')

    user.amor += 10
    saveDB(db)

    return conn.reply(
      m.chat,
      `❤️ Amor aumentado

${tag(sender)} 💕 ${tag(user.pareja)}

Nivel: ${user.amor}`,
      m,
      { mentions: [sender, user.pareja] }
    )
  }

  // ==============================
  // 📊 RELACION
  // ==============================
  if (command === 'relacion') {

    const user = getUser(sender)

    if (!user.pareja)
      return m.reply('💔 Estás soltero.')

    const parejaID = user.pareja
    const dias = Math.floor((ahora - user.relacionFecha) / 86400000)

    return conn.reply(
      m.chat,
      `💑 *Relación*

${tag(sender)} ❤️ ${tag(parejaID)}

Estado: ${user.estado}
Tiempo: ${dias} días
Amor: ${user.amor}`,
      m,
      { mentions: [sender, parejaID] }
    )
  }

  // ==============================
  // 📜 LISTA
  // ==============================
  if (command === 'listapareja') {

    let texto = '💞 *Parejas activas*\n\n'
    let count = 0

    for (let id in db) {
      let user = db[id]
      if (user.pareja && id < user.pareja) {
        texto += `💖 ${tag(id)} ❤️ ${tag(user.pareja)}\n`
        count++
      }
    }

    if (!count) texto += '😿 No hay parejas.'

    return conn.reply(m.chat, texto, m, { mentions: Object.keys(db) })
  }

  // ==============================
  // 🧹 CLEARSHIP
  // ==============================
  if (command === 'clearship') {

    const target = getTarget() || sender
    const user = getUser(target)

    if (!user.pareja)
      return m.reply('🧹 No hay relación.')

    const parejaID = user.pareja
    const pareja = getUser(parejaID)

    pareja.pareja = null
    pareja.estado = 'soltero'

    user.pareja = null
    user.estado = 'soltero'

    saveDB(db)

    return conn.reply(
      m.chat,
      `🧹 Relación eliminada

${tag(target)} 💔 ${tag(parejaID)}`,
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
  'casarse',
  'divorciar',
  'relacion',
  'amor',
  'clearship',
  'listapareja'
]

export default handler
