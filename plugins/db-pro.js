// 📂 plugins/db-ultra.js
// Base de datos universal sin dependencias — 100% funcional en Termux
// Comandos:
// .set clave valor
// .get clave
// .push clave valor
// .del clave
// .keys

import fs from 'fs'
import path from 'path'

const dbFolder = path.join(global.__dirname(import.meta.url), '../database')
const dbFile = path.join(dbFolder, 'db-ultra.json')

// Crear carpeta si no existe
if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder, { recursive: true })
}

// Cargar DB o crear
let db = {}
if (fs.existsSync(dbFile)) {
  try {
    db = JSON.parse(fs.readFileSync(dbFile))
  } catch (e) {
    db = {}
  }
}

// Guardar DB
const saveDB = () => {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2))
}

let handler = async (m, { conn, command, args }) => {
  const key = args[0]
  const value = args.slice(1).join(" ")

  switch (command) {

    case 'set':
      if (!key || !value) return m.reply('Uso: .set clave valor')
      db[key] = value
      saveDB()
      m.reply(`✔️ *Guardado*\n${key} = ${value}`)
    break

    case 'get':
      if (!key) return m.reply('Uso: .get clave')
      m.reply(db[key] ? `📌 ${key}: ${db[key]}` : '❌ No existe esa clave')
    break

    case 'push':
      if (!key || !value) return m.reply('Uso: .push clave valor')
      if (!Array.isArray(db[key])) db[key] = []
      db[key].push(value)
      saveDB()
      m.reply(`📌 Agregado a ${key}: ${value}`)
    break

    case 'del':
      if (!key) return m.reply('Uso: .del clave')
      delete db[key]
      saveDB()
      m.reply(`🗑️ Se borró ${key}`)
    break

    case 'keys':
      const keys = Object.keys(db)
      if (!keys.length) return m.reply('📭 Base de datos vacía')
      m.reply('📚 *Claves almacenadas:*\n' + keys.map(k => `• ${k}`).join('\n'))
    break
  }
}

handler.command = ['set','get','push','del','keys']
handler.tags = ['tools']
handler.help = ['set','get','push','del','keys']

export default handler
