import fs from 'fs'
import path from 'path'

const dbFile = path.join(process.cwd(), 'database', 'userdb.json')

/* --------------------------- SISTEMA DE BASE DE DATOS --------------------------- */

function ensureDB() {
  try {
    const dir = path.dirname(dbFile)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify({}))
  } catch (e) {
    console.error("❌ Error creando base de datos:", e)
  }
}

function loadDB() {
  ensureDB()
  try {
    return JSON.parse(fs.readFileSync(dbFile))
  } catch (e) {
    console.error("⚠️ Base dañada, reparando…")
    fs.writeFileSync(dbFile, JSON.stringify({}))
    return {}
  }
}

function saveDB(db) {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(db, null, 2))
  } catch (e) {
    console.error("❌ Error guardando DB:", e)
  }
}

/* --------------------------- OBTENER NOMBRE SEGURO --------------------------- */

async function safeGetName(conn, jid) {
  try {
    const name = await conn.getName(jid)
    return name || jid.split('@')[0]
  } catch {
    return jid.split('@')[0]
  }
}

/* --------------------------- CALCULAR NIVEL --------------------------- */

function getLevel(xp) {
  return Math.floor(xp / 100)
}

/* --------------------------- HANDLER PRINCIPAL --------------------------- */

let handler = async (m, { conn }) => {
  ensureDB()
  const db = loadDB()

  const target = m.mentionedJid?.[0] || m.sender
  const id = target

  // Crear usuario si no existe
  if (!db[id]) {
    db[id] = {
      id,
      name: await safeGetName(conn, id),
      xp: 0,
      msgs: 0,
      level: 0,
      lastSeen: 0
    }
  }

  // Actualizar datos
  db[id].msgs++
  db[id].xp += Math.floor(Math.random() * 8) + 3  // XP aleatorio entre 3 y 10
  db[id].level = getLevel(db[id].xp)
  db[id].lastSeen = Date.now()

  saveDB(db)

  // Respuesta
  const user = db[id]

  await conn.reply(
    m.chat,
    `📊 *Estadísticas del Usuario*\n` +
    `──────────────────────\n` +
    `👤 *Nombre:* ${user.name}\n` +
    `🆔 *ID:* ${user.id}\n` +
    `💬 *Mensajes:* ${user.msgs}\n` +
    `⭐ *XP:* ${user.xp}\n` +
    `🏆 *Nivel:* ${user.level}\n` +
    `⏳ *Última actividad:* ${new Date(user.lastSeen).toLocaleString()}\n`,
    m
  )
}

handler.help = ['dbuser']
handler.tags = ['tools']
handler.command = /^dbuser|db$/i

export default handler
