// 📂 plugins/owner-manager.js
// Dar o quitar owner dinámicamente
let handler = async (m, { conn, args, command }) => {
  try {
    // SOLO ROOT OWNERS pueden usar esto
    const rownersJid = (global.getROwnersJid?.() || [])
    const sender = conn.decodeJid ? conn.decodeJid(m.sender) : m.sender
    if (!rownersJid.includes(sender)) return m.reply('🚫 Solo ROOT owners pueden usar este comando.')

    // Validar target
    if (!args[0] && !m.mentionedJid?.length) 
      return m.reply('❌ Mencioná o escribe el número de alguien para dar/quitar owner.')

    let target = m.mentionedJid?.[0] || args[0].replace(/[^0-9]/g,'') + '@s.whatsapp.net'

    // Normaliza array
    global.owner = global.owner || []

    const simple = target.split('@')[0]

    if (command === 'aowner') {
      if (!global.owner.includes(simple)) {
        global.owner.push(simple)
        return conn.sendMessage(m.chat, {
          text: `✅ @${simple} ahora es owner`,
          mentions: [target]
        })
      } else {
        return conn.sendMessage(m.chat, {
          text: `⚠️ @${simple} ya es owner`,
          mentions: [target]
        })
      }
    }

    if (command === 'downer') {
      const index = global.owner.indexOf(simple)
      if (index > -1) {
        global.owner.splice(index,1)
        return conn.sendMessage(m.chat, {
          text: `⚠️ @${simple} dejó de ser owner`,
          mentions: [target]
        })
      } else {
        return conn.sendMessage(m.chat, {
          text: `⚠️ @${simple} no era owner`,
          mentions: [target]
        })
      }
    }

  } catch (e) {
    console.error('owner-manager:', e)
    m.reply('⚠️ Ocurrió un error al ejecutar el comando.')
  }
}

handler.command = ['aowner','downer']
handler.rowner = true
handler.group = false
handler.tags = ['owner']
export default handler
