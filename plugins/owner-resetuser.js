import fs from 'fs'

// =================== UTILIDADES ===================

function normalizeJid(jid = '') {
  return jid.replace(/@c\.us$/, '@s.whatsapp.net')
            .replace(/@s\.whatsapp.net$/, '@s.whatsapp.net')
}

const DB_WARN = './database/warns.json'

// =================== HANDLER ===================

const handler = async (m, { conn, text, mentionedJid }) => {
  let user = ''

  // 🔎 Detectar usuario
  if (mentionedJid?.length) user = mentionedJid[0]
  else if (text?.match(/\d+/g)) user = text.match(/\d+/g).join('') + '@s.whatsapp.net'
  else if (m.quoted?.sender) user = m.quoted.sender
  else return conn.reply(m.chat, '♻️ Menciona, responde o escribe el número del usuario.', m)

  const userJid = normalizeJid(user)

  // 🧹 Limpiar SOLO warns.json
  if (!fs.existsSync(DB_WARN))
    return conn.reply(m.chat, '⚠️ El archivo de advertencias no existe.', m)

  const warns = JSON.parse(fs.readFileSync(DB_WARN))

  let found = false
  for (const group in warns) {
    if (warns[group]?.[userJid]) {
      delete warns[group][userJid]
      found = true
    }
  }

  if (!found)
    return conn.reply(m.chat, 'ℹ️ El usuario no tiene advertencias registradas.', m)

  fs.writeFileSync(DB_WARN, JSON.stringify(warns, null, 2))

  const name = userJid.split('@')[0]
  const fecha = new Date().toLocaleString('es-UY', { timeZone: 'America/Montevideo' })

  await conn.sendMessage(m.chat, {
    text: `♻️ *ADVERTENCIAS RESETEADAS*\n\n👤 Usuario: @${name}\n🧹 Todas las advertencias eliminadas\n📅 ${fecha}`,
    mentions: [userJid]
  })
}

// =================== FLAGS ===================

handler.command = ['resetuser', 'resetwarns', 'borraradvs']
handler.owner = true
handler.tags = ['owner']

export default handler
