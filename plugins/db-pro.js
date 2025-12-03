// 📂 plugins/db-pro.js — FelixCat_Bot 🐾
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

  const action = args[0]

  // listar no necesita menciones
  if (action !== 'list') {
    const mention = m.mentionedJid?.[0]
    if (!mention) return m.reply("❗ Tenés que mencionar un usuario")

    var id = mention.replace(/[^0-9]/g, '')
    var jid = mention
  }

  const now = new Date().toISOString()

  // Función async ahora dentro del handler
  const ensureUser = async () => {
    if (!users[id]) {
      const name = await conn.getName(jid).catch(() => "Sin nombre")
      users[id] = {
        id,
        name,
        warns: 0,
        notes: [],
        registered: now,
        lastSeen: now,
        groups: []
      }
    }
  }

  // -------------------------
  //    ACCIONES DEL COMMAND
  // -------------------------

  switch (action) {

    case 'add':
      await ensureUser()
      if (!users[id].groups.includes(m.chat)) users[id].groups.push(m.chat)
      saveDB()
      return m.reply(`✔️ Usuario registrado:\n@${id}`, { mentions: [jid] })

    case 'info':
      await ensureUser()
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

    case 'set':
      const key = args[1]
      const value = args.slice(2).join(" ")
      if (!key || !value) return m.reply("Uso: .user set @user clave valor")

      await ensureUser()
      users[id][key] = value
      saveDB()
      return m.reply(`✔️ Actualizado:\n${key} = ${value}`)

    case 'get':
      const field = args[1]
      if (!field) return m.reply("Uso: .user get @user clave")

      await ensureUser()
      return m.reply(users[id][field] ?? "❌ No existe esa clave")

    case 'warn':
      await ensureUser()
      users[id].warns++
      users[id].lastSeen = now
      saveDB()
      return m.reply(`⚠ Warn agregado a @${id}\nTotal: ${users[id].warns}`, { mentions: [jid] })

    case 'unwarn':
      await ensureUser()
      if (users[id].warns > 0) users[id].warns--
      saveDB()
      return m.reply(`♻ Warn removido de @${id}\nTotal: ${users[id].warns}`, { mentions: [jid] })

    case 'del':
      delete users[id]
      saveDB()
      return m.reply(`🗑 Registro eliminado de @${id}`, { mentions: [jid] })

    case 'list':
      const keys = Object.keys(users)
      if (!keys.length) return m.reply("📭 No hay usuarios registrados")
      return m.reply(
        "📚 *Usuarios registrados:*\n\n" +
        keys.map(k => `• +${k} — warns: ${users[k].warns}`).join("\n")
      )
  }

  return m.reply("❗ Uso: .user (add/info/set/get/warn/unwarn/del/list)")
}

handler.help = ['user add', 'user info', 'user set', 'user get', 'user warn', 'user unwarn', 'user del', 'user list']
handler.tags = ['group']
handler.command = /^user$/i
export default handler
