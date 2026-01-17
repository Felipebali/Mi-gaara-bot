// 📂 plugins/owner-manager.js
// 🔥 Hot reload + persistencia segura en config.js (Baileys MD)

import fs from 'fs'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), 'config.js')

let handler = async (m, { conn, text = "", command }) => {
  try {
    let jid

    // ===== OBTENER JID REAL =====
    if (m.mentionedJid?.length) {
      jid = m.mentionedJid[0]
    } else if (m.quoted?.sender) {
      jid = m.quoted.sender
    } else {
      const matchPlus = text.match(/\+[0-9\s]+/)
      if (matchPlus) {
        jid = matchPlus[0].replace(/\D/g, '') + '@s.whatsapp.net'
      }
    }

    if (!jid) {
      return conn.reply(m.chat, '❌ Usa @usuario, responde un mensaje o +598...', m)
    }

    const who = jid.split('@')[0]

    // ===== ASEGURAR STRUCT EN MEMORIA =====
    if (!Array.isArray(global.owner)) global.owner = []
    if (!global.opts) global.opts = {}
    global.opts.owner = global.owner

    const exists = global.owner.find(o => o[0] === who)

    // ===== ADD OWNER =====
    if (/^(addowner|aowner)$/i.test(command)) {
      if (exists)
        return conn.reply(m.chat, '⚠️ Ese usuario ya es owner.', m, { mentions: [jid] })

      const newOwner = [who, 'Owner', true]
      global.owner.push(newOwner)

      saveOwnersToConfig()

      return conn.reply(
        m.chat,
        `✅ @${who} agregado como owner\n⚡ Permisos activos y guardados`,
        m,
        { mentions: [jid] }
      )
    }

    // ===== REMOVE OWNER =====
    if (/^(removeowner|rowner)$/i.test(command)) {
      if (!exists)
        return conn.reply(m.chat, '❌ Ese usuario no es owner.', m, { mentions: [jid] })

      if (global.owner.length === 1)
        return conn.reply(m.chat, '❌ No se puede eliminar el último owner.', m)

      global.owner = global.owner.filter(o => o[0] !== who)
      global.opts.owner = global.owner

      saveOwnersToConfig()

      return conn.reply(
        m.chat,
        `✅ @${who} removido de owners\n⚡ Cambios guardados`,
        m,
        { mentions: [jid] }
      )
    }

  } catch (e) {
    console.error('OWNER MANAGER ERROR:', e)
    conn.reply(m.chat, '❌ Error interno del owner-manager.', m)
  }
}

handler.command = /^(addowner|removeowner|aowner|rowner)$/i
handler.owner = true

export default handler

// ===== GUARDAR EN config.js (SEGURO) =====
function saveOwnersToConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return

  let config = fs.readFileSync(CONFIG_PATH, 'utf8')

  const ownersBlock =
`global.owner = [
${global.owner.map(o => `  ['${o[0]}', '${o[1]}', ${o[2]}]`).join(',\n')}
]
`

  if (/global\.owner\s*=/.test(config)) {
    // Reemplazo seguro SOLO del bloque owner
    config = config.replace(
      /global\.owner\s*=\s*\[[\s\S]*?\]\s*/m,
      ownersBlock + '\n'
    )
  } else {
    // Si no existe, lo agrega arriba del archivo
    config = ownersBlock + '\n' + config
  }

  fs.writeFileSync(CONFIG_PATH, config.trim() + '\n')
}
