// 📂 plugins/db-users.js — FelixCat_Bot 🐾
// Base de datos de usuarios del grupo (sin dependencias, 100% Termux safe)

import fs from 'fs'
import path from 'path'

const dbFolder = path.join(global.__dirname(import.meta.url), '../database')
const dbFile = path.join(dbFolder, 'users.json')

// Crear carpeta si no existe
if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder, { recursive: true })

// Cargar DB
let users = {}
if (fs.existsSync(dbFile)) {
  try { users = JSON.parse(fs.readFileSync(dbFile)) }
  catch { users = {} }
}

// Guardar DB
const saveDB = () => fs.writeFileSync(dbFile, JSON.stringify(users, null, 2))

let handler = async (m, { conn, command, args }) => {

  // obtener ID
  const mention = m.mentionedJid?.[0]
  if (!mention && !['list'].includes(args[0]))
    return m.reply("❗ Tenés que mencionar un usuario")

  const id = mention ? mention.replace(/[^0-9]/g, '') : null

  const now = new Date().toISOString()

  // aseguramos el objeto
  const ensureUser = () => {
    if (!users[id]) {
      users[id] = {
        id,
        name: (await conn.getName(mention)),
        warns: 0,
        notes: [],
        registered: now,
        lastSeen: now,
        groups: [],
      }
    }
  }

  switch (command) {

    // ➤ Registrar usuario
    case 'user':
      const action = args[0]

      // .user add @user
      if (action === 'add') {
        ensureUser()
        if (!users[id].groups.includes(m.chat)) users[id].groups.push(m.chat)
        saveDB()
        return m.reply(`✔️ Usuario registrado:\n@${id}`, { mentions: [mention] })
      }

      // .user info @user
      if (action === 'info') {
        ensureUser()
        const u = users[id]
        return m.reply(
`📋 *INFO DEL USUARIO*
👤 Nombre: ${u.name}
📱 Número: +${u.id}
⚠ Warns: ${u.warns}
📝 Notas: ${u.notes.length}
📅 Registrado: ${u.registered}
👀 Última actividad: ${u.lastSeen}
👥 Grupos: ${u.groups.length}`
        )
      }

      // .user set @user clave valor
      if (action === 'set') {
        const key = args[1]
        const value = args.slice(2).join(" ")
        if (!key || !value) return m.reply("Uso: .user set @user clave valor")

        ensureUser()
        users[id][key] = value
        saveDB()
        return m.reply(`✔️ Actualizado:\n${key} = ${value}`)
      }

      // .user get @user clave
      if (action === 'get') {
        const key = args[1]
        if (!key) return m.reply("Uso: .user get @user clave")

        ensureUser()
        return m.reply(users[id][key] ?? "❌ No existe esa clave")
      }

      // .user warn @user
      if (action === 'warn') {
        ensureUser()
        users[id].warns++
        users[id].lastSeen = now
        saveDB()
        return m.reply(`⚠ Warn agregado a @${id}\nTotal: ${users[id].warns}`, { mentions: [mention] })
      }

      // .user unwarn @user
      if (action === 'unwarn') {
        ensureUser()
        if (users[id].warns > 0) users[id].warns--
        saveDB()
        return m.reply(`♻ Warn removido a @${id}\nTotal: ${users[id].warns}`, { mentions: [mention] })
      }

      // .user del @user
      if (action === 'del') {
        delete users[id]
        saveDB()
        return m.reply(`🗑 Registro eliminado de @${id}`, { mentions: [mention] })
      }

      // .user list
      if (action === 'list') {
        const keys = Object.keys(users)
        if (!keys.length) return m.reply("📭 No hay usuarios registrados")
        return m.reply(
          "📚 *Usuarios registrados:*\n\n" +
          keys.map(k => `• +${k} — warns: ${users[k].warns}`).join("\n")
        )
      }

      return m.reply("❗ Comando inválido.")

  }
}

handler.help = ['user add', 'user info', 'user set', 'user get', 'user warn', 'user unwarn', 'user del', 'user list']
handler.tags = ['group']
handler.command = /^user$/i
export default handler
