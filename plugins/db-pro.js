import fs from 'fs'
import path from 'path'

const dbFile = path.join(process.cwd(), 'database', 'userdb.json')

// Asegurar archivo
function ensureDB() {
  if (!fs.existsSync(path.dirname(dbFile))) {
    fs.mkdirSync(path.dirname(dbFile), { recursive: true })
  }
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({}))
  }
}

function loadDB() {
  ensureDB()
  return JSON.parse(fs.readFileSync(dbFile))
}

function saveDB(db) {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2))
}

// Obtener nombre sin romper el bot
async function safeGetName(conn, jid) {
  try {
    const name = await conn.getName(jid)
    return name || jid.split('@')[0]
  } catch {
    return jid.split('@')[0]
  }
}

let handler = async (m, { conn, text }) => {
  ensureDB()
  const db = loadDB()

  const mention = m.mentionedJid?.[0] || m.sender
  const id = mention

  // Crear usuario si no existe
  if (!db[id]) {
    db[id] = {
      id,
      name: await safeGetName(conn, id),
      xp: 0,
      msgs: 0,
      lastSeen: 0
    }
  }

  // Actualizar datos
  db[id].msgs++
  db[id].lastSeen = Date.now()

  saveDB(db)

  await conn.reply(m.chat, `📂 Datos del usuario:\n\n` +
    `👤 *Nombre:* ${db[id].name}\n` +
    `🆔 *ID:* ${db[id].id}\n` +
    `💬 *Mensajes:* ${db[id].msgs}\n` +
    `⏳ *Última vez:* ${new Date(db[id].lastSeen).toLocaleString()}`, m)
}

handler.help = ['dbuser']
handler.tags = ['tools']
handler.command = /^dbuser|db$/i

export default handler
