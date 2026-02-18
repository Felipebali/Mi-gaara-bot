import fs from 'fs'
import path from 'path'

// 📁 Crear carpeta database automáticamente
const dir = './database'
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}

// 📄 Archivo parejas.json
const file = path.join(dir, 'parejas.json')

// Crear archivo si no existe
if (!fs.existsSync(file)) {
  fs.writeFileSync(file, JSON.stringify({}, null, 2))
}

// Funciones DB
const loadDB = () => JSON.parse(fs.readFileSync(file))
const saveDB = (data) => fs.writeFileSync(file, JSON.stringify(data, null, 2))

let handler = async (m, { conn, command }) => {

  let db = loadDB()

  const sender = m.sender
  const ahora = Date.now()

  // 🔐 Owners globales
  const ownerNumbers = (global.owner || []).map(v => {
    if (Array.isArray(v)) v = v[0]
    return String(v).replace(/[^0-9]/g, '')
  })

  const senderNumber = sender.replace(/[^0-9]/g, '')
  const isOwner = ownerNumbers.includes(senderNumber)

  // 👤 Crear usuario si no existe
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

  const user = getUser(sender)

  const getTarget = () => {
    if (m.mentionedJid?.length) return m.mentionedJid[0]
    if (m.quoted?.sender) return m.quoted.sender
    return null
  }

  // =====================
  // 💌 PROPUESTA
  // =====================

  if (command === 'pareja') {

    const target = getTarget()
    if (!target) return m.reply('💌 Menciona a la persona.')

    if (target === sender)
      return m.reply('🤨 No puedes proponerte a ti mismo.')

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

  // =====================
  // ✅ ACEPTAR
  // =====================

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

    saveDB(db)

    return conn.reply(
      m.chat,
      `💞 ¡Ahora son pareja!\n@${sender.split('@')[0]} ❤️ @${proposer.split('@')[0]}`,
      m,
      { mentions: [sender, proposer] }
    )
  }

  // =====================
  // ❌ RECHAZAR
  // =====================

  if (command === 'rechazar') {

    if (!user.propuesta)
      return m.reply('❌ No tienes propuestas.')

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

  // =====================
  // 💔 TERMINAR
  // =====================

  if (command === 'terminar') {

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

  // =====================
  // 💍 CASARSE
  // =====================

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

    saveDB(db)

    return conn.reply(
      m.chat,
      `💍 ¡Se casaron!\n@${sender.split('@')[0]} ❤️ @${user.pareja.split('@')[0]}`,
      m,
      { mentions: [sender, user.pareja] }
    )
  }

  // =====================
  // ⚖️ DIVORCIO
  // =====================

  if (command === 'divorciar') {

    if (user.estado !== 'casados')
      return m.reply('❌ No estás casado.')

    const parejaID = user.pareja
    const pareja = getUser(parejaID)

    pareja.pareja = null
    pareja.estado = 'soltero'
    pareja.matrimonioFecha = null
    pareja.relacionFecha = null

    user.pareja = null
    user.estado = 'soltero'
    user.matrimonioFecha = null
    user.relacionFecha = null

    saveDB(db)

    return conn.reply(
      m.chat,
      `⚖️ Divorcio realizado\n@${sender.split('@')[0]} 💔 @${parejaID.split('@')[0]}`,
      m,
      { mentions: [sender, parejaID] }
    )
  }

  // =====================
  // ❤️ AMOR
  // =====================

  if (command === 'amor') {

    if (!user.pareja)
      return m.reply('❌ No tienes pareja.')

    user.amor += 10

    saveDB(db)

    return m.reply(`❤️ Amor aumentado\nNivel: ${user.amor}`)
  }

  // =====================
  // 📊 RELACION
  // =====================

  if (command === 'relacion') {

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

  // =====================
  // 🧹 CLEARSHIP (OWNER)
  // =====================

  if (command === 'clearship') {

    if (!isOwner)
      return m.reply('❌ Solo los dueños pueden usar esto.')

    db = {}
    saveDB(db)

    return m.reply('🧹 Todas las relaciones fueron borradas.')
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
