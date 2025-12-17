// plugins/grupo-configuracion.js — Panel limpio (EVENTO)

const aliasMap = {
  antifake: ["antifake", "antiFake"],
  antispam: ["antispam", "antiSpam"],
  antilink: ["antilink", "antiLink"],
  antilink2: ["antilink2", "antiLink2"],
  antitagall: ["tagallEnabled", "antitagall"],
  evento: ["evento", "detect"],
  onlyadmin: ["onlyadmin", "onlyAdmin", "soloAdmins", "modoadmin"],
  nsfw: ["nsfw"],
  juegos: ["juegos", "games"]
}

function getChatValue(chat, key) {
  const keys = aliasMap[key]
  if (!keys) return false
  for (const k of keys) {
    if (chat[k] !== undefined)
      return chat[k] === true || chat[k] === 1 || chat[k] === 'on'
  }
  return false
}

let handler = async (m, { isAdmin, isOwner }) => {
  if (!m.isGroup)
    return m.reply('⚠️ Este comando solo funciona en grupos')
  if (!isAdmin && !isOwner)
    return m.reply('🚫 Solo administradores pueden usar este panel')

  const chat = global.db.data.chats[m.chat] || {}

  const panel = `
╭━━━〔 ⚙️ PANEL DEL GRUPO 〕━━━╮
│ Usa *.comando* para activar/desactivar
│
│ 🛡️ SEGURIDAD
│ 🔗 AntiLink      : ${getChatValue(chat, 'antilink') ? '🟢' : '🔴'}
│ 🔗 AntiLink 2    : ${getChatValue(chat, 'antilink2') ? '🟢' : '🔴'}
│ 🚫 AntiFake      : ${getChatValue(chat, 'antifake') ? '🟢' : '🔴'}
│ 🚫 AntiSpam      : ${getChatValue(chat, 'antispam') ? '🟢' : '🔴'}
│ ⚡ AntiTagAll    : ${getChatValue(chat, 'antitagall') ? '🟢' : '🔴'}
│
│ 🛠️ ADMINISTRACIÓN
│ 🎭 Evento grupo  : ${getChatValue(chat, 'evento') ? '🟢' : '🔴'}
│ 🛡️ Solo Admins  : ${getChatValue(chat, 'onlyadmin') ? '🟢' : '🔴'}
│
│ 🎮 EXTRAS
│ 🎮 Juegos        : ${getChatValue(chat, 'juegos') ? '🟢' : '🔴'}
│ 🔞 NSFW          : ${getChatValue(chat, 'nsfw') ? '🟢' : '🔴'}
│
╰━━━━━━━━━━━━━━━━━━━━━━╯
`.trim()

  m.reply(panel)
}

handler.help = ['panel', 'config']
handler.tags = ['group']
handler.command = ['panel', 'config']
handler.group = true

export default handler
