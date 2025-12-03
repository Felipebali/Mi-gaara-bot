// 📂 plugins/db-pro.js — FelixCat_Bot 🐾
// Plugin supremo de manejo SQLite desde WhatsApp
// Comandos:
// .dbtables
// .dbver tabla [página]
// .dbfind tabla columna valor
// .dbjson tabla
// .dbcsv tabla
// .dbbackup

import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import fs from 'fs'

const DB_PATH = './database/data.db'
const BACKUP_DIR = './database/backups/'

// Owners
const owners = ["59896026646@s.whatsapp.net", "59898719147@s.whatsapp.net"]

let db
async function getDB() {
  if (!db) {
    db = await open({ filename: DB_PATH, driver: sqlite3.Database })
  }
  return db
}

// Crear carpeta de backups
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true })

let handler = async (m, { conn, text, args, command }) => {

  if (!owners.includes(m.sender))
    return m.reply("⛔ Solo owners pueden usar comandos de base de datos.")

  const database = await getDB()

  // ? ============== COMANDO: .dbtables ==============
  if (command === 'dbtables') {
    const rows = await database.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )

    if (!rows.length) return m.reply("⚠️ No hay tablas en la base de datos.")

    let msg = "📂 *Tablas en la Base de Datos:*\n\n"
    rows.forEach(r => msg += `• ${r.name}\n`)

    return m.reply(msg)
  }

  // ? ============== COMANDO: .dbver tabla [pagina] ==============
  if (command === 'dbver') {
    if (!args[0]) return m.reply("❗ Uso: *.dbver tabla [pagina]*")
    let table = args[0]
    let page = parseInt(args[1] || 1)
    let limit = 15
    let offset = (page - 1) * limit

    const ok = await database.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      table
    )
    if (!ok) return m.reply("❗ La tabla no existe.")

    const rows = await database.all(
      `SELECT * FROM "${table}" LIMIT ${limit} OFFSET ${offset}`
    )

    if (!rows.length) return m.reply(`⚠️ No hay más datos en la página ${page}.`)

    return m.reply(
      `📋 *Tabla:* ${table}\n📄 *Página:* ${page}\n\n` +
      "```" + JSON.stringify(rows, null, 2).slice(0, 4000) + "```"
    )
  }

  // ? ============== COMANDO: .dbfind tabla columna valor ==============
  if (command === 'dbfind') {
    if (args.length < 3)
      return m.reply("❗ Uso: *.dbfind tabla columna valor*")

    let [tabla, columna, ...rest] = args
    let valor = rest.join(" ")

    const ok = await database.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      tabla
    )
    if (!ok) return m.reply("❗ La tabla no existe.")

    try {
      const sql = `SELECT * FROM "${tabla}" WHERE "${columna}" LIKE ? LIMIT 30`
      const rows = await database.all(sql, `%${valor}%`)

      if (!rows.length) return m.reply("⚠️ Sin coincidencias.")

      return m.reply(
        `🔍 *Resultados (${rows.length})*\n\n` +
        "```" + JSON.stringify(rows, null, 2).slice(0, 4000) + "```"
      )

    } catch (e) {
      return m.reply("❌ Error, revisa el nombre de la columna.")
    }
  }

  // ? ============== COMANDO: .dbjson tabla ==============
  if (command === 'dbjson') {
    if (!args[0]) return m.reply("❗ Uso: *.dbjson tabla*")

    let tabla = args[0]

    const ok = await database.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      tabla
    )
    if (!ok) return m.reply("❗ La tabla no existe.")

    const rows = await database.all(`SELECT * FROM "${tabla}"`)

    let file = `./${tabla}.json`
    fs.writeFileSync(file, JSON.stringify(rows, null, 2))

    await conn.sendMessage(m.chat, {
      document: fs.readFileSync(file),
      fileName: `${tabla}.json`,
      mimetype: 'application/json'
    }, { quoted: m })

    fs.unlinkSync(file)
    return
  }

  // ? ============== COMANDO: .dbcsv tabla ==============
  if (command === 'dbcsv') {
    if (!args[0]) return m.reply("❗ Uso: *.dbcsv tabla*")

    let tabla = args[0]

    const ok = await database.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      tabla
    )
    if (!ok) return m.reply("❗ La tabla no existe.")

    const rows = await database.all(`SELECT * FROM "${tabla}"`)

    if (!rows.length) return m.reply("⚠️ La tabla está vacía.")

    let header = Object.keys(rows[0]).join(",") + "\n"
    let body = rows.map(r => Object.values(r).join(",")).join("\n")
    let csv = header + body

    let file = `./${tabla}.csv`
    fs.writeFileSync(file, csv)

    await conn.sendMessage(m.chat, {
      document: fs.readFileSync(file),
      fileName: `${tabla}.csv`,
      mimetype: 'text/csv'
    }, { quoted: m })

    fs.unlinkSync(file)
    return
  }

  // ? ============== COMANDO: .dbbackup ==============
  if (command === 'dbbackup') {
    const timestamp = Date.now()
    const backupPath = `${BACKUP_DIR}backup-${timestamp}.db`

    fs.copyFileSync(DB_PATH, backupPath)

    await conn.sendMessage(m.chat, {
      document: fs.readFileSync(backupPath),
      fileName: `backup-${timestamp}.db`,
      mimetype: 'application/octet-stream'
    }, { quoted: m })

    return m.reply("📦 Backup creado y enviado ✔")
  }
}

handler.help = ['dbtables', 'dbver', 'dbfind', 'dbjson', 'dbcsv', 'dbbackup']
handler.tags = ['owner']
handler.command = /^dbtables|dbver|dbfind|dbjson|dbcsv|dbbackup$/i
handler.rowner = true

export default handler
