// 📂 plugins/owner-manager.js
// 🔥 Hot reload + persistencia en config.js

import fs from 'fs'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), 'config.js')

let handler = async (m, { conn, text = "", command }) => {
  try {
    let jid

    // ===== OBTENER JID =====
    if (m.mentionedJid?.length) {
      jid = m.mentionedJid[0]
    } else if (m.quoted?.sender) {
      jid = m.quoted.sender
    } else {
      const matchPlus = text.match(/\+[0-9\s]+/)
      if (matchPlus) {
        jid = matchPlus[0].replace(/\D/g, "") + "@s.whatsapp.net"
      }
    }

    if (!jid) {
      return conn.reply(m.chat, "❌ Usa @usuario, responde o +598...", m)
    }

    const who = jid.split("@")[0]

    // ===== ASEGURAR STRUCT =====
    if (!Array.isArray(global.owner)) global.owner = []
    if (!global.opts) global.opts = {}
    if (!Array.isArray(global.opts.owner)) global.opts.owner = global.owner

    const exists = global.owner.find(o => o[0] === who)

    // ===== ADD OWNER =====
    if (/^(addowner|aowner)$/i.test(command)) {
      if (exists) return conn.reply(m.chat, "⚠️ Ya es owner.", m)

      const newOwner = [who, "Owner", true]
      global.owner.push(newOwner)
      global.opts.owner.push(newOwner)

      saveOwners()

      return conn.reply(
        m.chat,
        `✅ @${who} agregado como owner\n💾 Guardado en config.js`,
        m,
        { mentions: [jid] }
      )
    }

    // ===== REMOVE OWNER =====
    if (/^(removeowner|rowner)$/i.test(command)) {
      if (!exists) return conn.reply(m.chat, "❌ No es owner.", m)
      if (global.owner.length === 1)
        return conn.reply(m.chat, "❌ No se puede eliminar el último owner.", m)

      global.owner = global.owner.filter(o => o[0] !== who)
      global.opts.owner = global.opts.owner.filter(o => o[0] !== who)

      saveOwners()

      return conn.reply(
        m.chat,
        `✅ @${who} removido de owners\n💾 Config actualizado`,
        m,
        { mentions: [jid] }
      )
    }

  } catch (e) {
    console.error("OWNER MANAGER ERROR:", e)
  }
}

handler.command = /^(addowner|removeowner|aowner|rowner)$/i
handler.owner = true

export default handler

// ===== GUARDAR EN config.js =====
function saveOwners() {
  if (!fs.existsSync(CONFIG_PATH)) return

  let config = fs.readFileSync(CONFIG_PATH, 'utf8')

  const ownersText =
    `global.owner = [\n` +
    global.owner
      .map(o => `  ['${o[0]}', '${o[1]}', ${o[2]}]`)
      .join(',\n') +
    `\n]\n`

  config = config.replace(
    /global\.owner\s*=\s*\[[\s\S]*?\]/,
    ownersText
  )

  fs.writeFileSync(CONFIG_PATH, config)
}
