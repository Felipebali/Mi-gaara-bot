// 📂 plugins/db-pro-lite.js
// Base de datos avanzada SIN sqlite — 100% compatible con Termux
// Comandos:
// .dbset clave valor
// .dbget clave
// .dbpush clave valor
// .dbdel clave
// .dblist

import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import fs from 'fs'

const dbPath = path.join(global.__dirname(import.meta.url), '../database/db-pro.json')

// Crear carpeta si no existe
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
}

// Inicializar DB
const adapter = new JSONFile(dbPath)
const db = new Low(adapter, { data: {} })

await db.read()

let handler = async (m, { conn, command, args }) => {
  const key = args[0]
  const value = args.slice(1).join(" ")

  switch (command) {

    case 'dbset':
      if (!key || !value) 
        return m.reply('*Uso:* .dbset clave valor')
      db.data[key] = value
      await db.write()
      m.reply(`✔️ Guardado:\n*${key}* = ${value}`)
    break

    case 'dbget':
      if (!key) return m.reply('*Uso:* .dbget clave')
      const res = db.data[key]
      m.reply(res ? `📌 Valor de *${key}:*\n${res}` : '❌ No existe esa clave')
    break

    case 'dbpush':
      if (!key || !value) return m.reply('*Uso:* .dbpush clave valor')
      if (!Array.isArray(db.data[key])) db.data[key] = []
      db.data[key].push(value)
      await db.write()
      m.reply(`📌 Agregado a *${key}:*\n${value}`)
    break

    case 'dbdel':
      if (!key) return m.reply('*Uso:* .dbdel clave')
      delete db.data[key]
      await db.write()
      m.reply(`🗑️ Se borró la clave: ${key}`)
    break

    case 'dblist':
      if (!Object.keys(db.data).length) return m.reply('📭 BD vacía')
      m.reply(
        '📚 *Claves guardadas:*\n' +
        Object.keys(db.data).map(k => `• ${k}`).join('\n')
      )
    break
  }
}

handler.help = ['dbset','dbget','dbpush','dbdel','dblist']
handler.tags = ['tools']
handler.command = ['dbset','dbget','dbpush','dbdel','dblist']

export default handler
