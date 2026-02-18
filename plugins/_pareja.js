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

  // ================= 💌 PROPUESTA =================

  if (command === 'pareja') {

    const target = getTarget()
    if (!target) return m.reply('💌 Menciona o responde al mensaje de la persona.')

    if (target === sender)
      return m.reply('❌ No puedes proponerte a ti mismo.')

    const user = getUser(sender)
    const tu = getUser(target)

    if (user.estado !== 'soltero')
      return m.reply('❌ Ya tienes pareja.')

    if (tu.estado !== 'soltero')
      return m.reply('❌ Esa persona ya tiene pareja.')

    tu.propuesta = sender
    tu.propuestaFecha = ahora

    saveDB(db)

    return conn.reply(
      m.chat,
      `💖 @${sender.split('@')[0]} quiere ser pareja de @${target.split('@')[0]} ❤️\n\nResponde:\n.aceptar o .rechazar`,
      m,
      { mentions: [sender, target] }
    )
  }

  // ================= ✅ ACEPTAR =================

  if (command === 'aceptar') {

    const user = getUser(sender)

    if (!user.propuesta)
      return m.reply('❌ No tienes propuestas pendientes.')

    const proposer = user.propuesta
    const proposerUser = getUser(proposer)

    if (proposerUser.estado !== 'soltero') {
      user.propuesta = null
      saveDB(db)
      return m.reply('❌ La persona ya no está disponible.')
    }

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
      `💞 ¡Ahora son pareja!\n@${sender.split('@')[0]} ❤️ @${proposer.split('@')[0]}`,
      m,
      { mentions: [sender, proposer] }
    )
  }

  // ================= ❌ RECHAZAR =================

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
      `💔 @${sender.split('@')[0]} rechazó a @${proposer.split('@')[0]}`,
      m,
      { mentions: [sender, proposer] }
    )
  }

  // ================= 💔 TERMINAR =================

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
      `💔 Relación terminada\n@${sender.split('@')[0]} 💔 @${parejaID.split('@')[0]}`,
      m,
      { mentions: [sender, parejaID] }
    )
  }

  // ================= 💍 CASAR =================

  if (command === 'casar') {

    const user = getUser(sender)

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

    saveDB(db)

    return conn.reply(
      m.chat,
      `💍 ¡Se casaron!\n@${sender.split('@')[0]} ❤️ @${user.pareja.split('@')[0]}`,
      m,
      { mentions: [sender, user.pareja] }
    )
  }

  // ================= ⚖️ DIVORCIO =================

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
      `⚖️ Divorcio realizado\n@${sender.split('@')[0]} 💔 @${parejaID.split('@')[0]}`,
      m,
      { mentions: [sender, parejaID] }
    )
  }

  // ================= ❤️ AMOR =================

  if (command === 'amor') {

    const user = getUser(sender)

    if (!user.pareja)
      return m.reply('❌ No tienes pareja.')

    user.amor += 10
    saveDB(db)

    return m.reply(`❤️ Amor aumentado\nNivel: ${user.amor}`)
  }

  // ================= 📊 RELACION =================

  if (command === 'relacion') {

    const user = getUser(sender)

    if (!user.pareja)
      return m.reply('❌ Estás soltero.')

    const parejaID = user.pareja
    const dias = Math.floor((ahora - user.relacionFecha) / 86400000)

    return conn.reply(
      m.chat,
      `💑 RELACIÓN\n\n👤 @${sender.split('@')[0]}\n❤️ @${parejaID.split('@')[0]}\n\n💞 Estado: ${user.estado}\n📅 Días juntos: ${dias}\n❤️ Amor: ${user.amor}`,
      m,
      { mentions: [sender, parejaID] }
    )
  }

  // ================= 🧹 CLEARSHIP =================

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
      `🧹 Relación eliminada\n@${target.split('@')[0]} 💔 @${parejaID.split('@')[0]}`,
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
