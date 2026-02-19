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

    if (user.estado !== 'soltero') {
      return conn.reply(
        m.chat,
        `😡 *¡INFIEL DETECTADO!* 😡

${tag(sender)} intentó buscar otra pareja...

Pero ya está con ${tag(user.pareja)} 💔🔥`,
        m,
        { mentions: [sender, user.pareja] }
      )
    }

    if (tu.estado !== 'soltero') {

      const parejaActual = tu.pareja

      return conn.reply(
        m.chat,
        `🚨 *¡DRAMA AMOROSO!* 🚨

${tag(sender)} intentó conquistar a ${tag(target)} 💘

Pero... ${tag(target)} ya está con ${tag(parejaActual)} 😳🔥`,
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

${tag(sender)} ❤️ ${tag(proposer)}`,
      m,
      { mentions: [sender, proposer] }
    )
  }

  // ==============================
  // 💋 BESAR
  // ==============================
  if (command === 'besar') {

    const user = getUser(sender)
    const target = getTarget()

    if (!target) return m.reply('💋 Menciona a quien quieres besar.')

    if (!user.pareja)
      return m.reply('💔 No tienes pareja.')

    if (target !== user.pareja) {
      return conn.reply(
        m.chat,
        `🚨 *INFIDELIDAD DETECTADA* 🚨

${tag(sender)} intentó besar a ${tag(target)} 😳

Pero su pareja es ${tag(user.pareja)} 💔🔥`,
        m,
        { mentions: [sender, target, user.pareja] }
      )
    }

    const pareja = getUser(user.pareja)

    let nuevoAmor = (user.amor || 0) + 5
    user.amor = nuevoAmor
    pareja.amor = nuevoAmor

    saveDB(db)

    return conn.reply(
      m.chat,
      `💋 *Beso romántico* 💋

${tag(sender)} besó a ${tag(user.pareja)} 😘

❤️ Amor: ${nuevoAmor}`,
      m,
      { mentions: [sender, user.pareja] }
    )
  }

  // ==============================
  // 🤗 ABRAZAR
  // ==============================
  if (command === 'abrazar') {

    const user = getUser(sender)
    const target = getTarget()

    if (!target) return m.reply('🤗 Menciona a quien quieres abrazar.')

    if (!user.pareja)
      return m.reply('💔 No tienes pareja.')

    if (target !== user.pareja) {
      return conn.reply(
        m.chat,
        `🚨 *¡ALERTA DE CELOS!* 🚨

${tag(sender)} quiso abrazar a ${tag(target)} 😳

Pero su pareja es ${tag(user.pareja)} 💔`,
        m,
        { mentions: [sender, target, user.pareja] }
      )
    }

    const pareja = getUser(user.pareja)

    let nuevoAmor = (user.amor || 0) + 3
    user.amor = nuevoAmor
    pareja.amor = nuevoAmor

    saveDB(db)

    return conn.reply(
      m.chat,
      `🤗 *Abrazo lleno de amor*

${tag(sender)} abrazó a ${tag(user.pareja)} 🥰

❤️ Amor: ${nuevoAmor}`,
      m,
      { mentions: [sender, user.pareja] }
    )
  }

  // ==============================
  // ❤️ AMOR
  // ==============================
  if (command === 'amor') {

    const user = getUser(sender)

    if (!user.pareja)
      return m.reply('❤️ No tienes pareja.')

    const parejaID = user.pareja
    const pareja = getUser(parejaID)

    let nuevoAmor = (user.amor || 0) + 10

    user.amor = nuevoAmor
    pareja.amor = nuevoAmor

    saveDB(db)

    return conn.reply(
      m.chat,
      `❤️ *Amor aumentado*

${tag(sender)} 💕 ${tag(parejaID)}

Nivel: ${nuevoAmor}`,
      m,
      { mentions: [sender, parejaID] }
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
  'besar',
  'abrazar',
  'clearship',
  'listapareja'
]

export default handler
