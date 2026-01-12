import fs from 'fs'
import path from 'path'

// =================== UTILIDADES ===================

function normalizeJid(jid) {
  if (!jid) return null
  return jid.replace(/@c\.us$/, '@s.whatsapp.net').replace(/:\d+/, '')
}

function loadAllDatabases() {
  const dbPath = './database'
  const databases = {}

  if (!fs.existsSync(dbPath)) return databases

  const files = fs.readdirSync(dbPath).filter(f => f.endsWith('.json'))

  for (const file of files) {
    try {
      const filePath = path.join(dbPath, file)
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      databases[file] = { path: filePath, data }
    } catch {}
  }
  return databases
}

function saveDatabase(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
    return true
  } catch {
    return false
  }
}

function cleanUserFromObject(obj, userJid) {
  let cleaned = false
  if (!obj || typeof obj !== 'object') return cleaned

  if (obj === userJid || obj.id === userJid || obj.jid === userJid) return true

  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue

    if (key === userJid) {
      delete obj[key]
      cleaned = true
      continue
    }

    if (Array.isArray(obj[key])) {
      const len = obj[key].length
      obj[key] = obj[key].filter(v => {
        if (typeof v === 'string') return v !== userJid
        if (typeof v === 'object' && v) return v.id !== userJid && v.jid !== userJid
        return true
      })
      if (obj[key].length < len) cleaned = true
    }
    else if (typeof obj[key] === 'object' && obj[key]) {
      if (cleanUserFromObject(obj[key], userJid)) cleaned = true
    }
  }
  return cleaned
}

// =================== HANDLER ===================

const handler = async (m, { conn, text, mentionedJid }) => {
  try {
    let user = ''

    if (mentionedJid?.length) user = mentionedJid[0]
    else if (text?.match(/\d+/)) user = text.match(/\d+/)[0] + '@s.whatsapp.net'
    else if (m.quoted?.sender) user = m.quoted.sender
    else return conn.reply(m.chat, '♻️ Menciona, responde o escribe el número.', m)

    const userJid = normalizeJid(user)
    if (!userJid) return conn.reply(m.chat, '⚠️ JID inválido.', m)

    const databases = loadAllDatabases()
    let totalCleaned = 0
    const cleanedFiles = []

    for (const [name, db] of Object.entries(databases)) {
      if (cleanUserFromObject(db.data, userJid)) {
        if (saveDatabase(db.path, db.data)) {
          totalCleaned++
          cleanedFiles.push(name)
        }
      }
    }

    if (global.db?.data) {
      if (cleanUserFromObject(global.db.data, userJid)) {
        if (global.db.write) await global.db.write()
        totalCleaned++
        cleanedFiles.push('global.db')
      }
    }

    const fecha = new Date().toLocaleString('es-UY', { timeZone: 'America/Montevideo' })
    const who = userJid
    const name = who.split('@')[0]

    let msg = `♻️ *Limpieza completada*\n\n`
    msg += `👤 Usuario: @${name}\n`
    msg += `✅ Bases modificadas: ${totalCleaned}\n`

    if (cleanedFiles.length) {
      msg += `\n📁 Archivos actualizados:\n`
      cleanedFiles.forEach(f => msg += `• ${f}\n`)
    }

    msg += `\n📅 ${fecha}`

    await conn.sendMessage(m.chat, { text: msg, mentions: [who] }, { quoted: m })

  } catch (e) {
    console.error(e)
    return conn.reply(m.chat, '❌ Error al resetear usuario. Revisa la consola.', m)
  }
}

// =================== FLAGS ===================

handler.command = ['resetuser', 'deletedatauser', 'borrardatos', 'r']
handler.owner = true
handler.tags = ['owner']

export default handler
