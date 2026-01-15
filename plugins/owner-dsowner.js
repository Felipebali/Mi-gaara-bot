// 📂 plugins/owner-manager.js
// Dar o quitar owner dinámicamente
let handler = async (m, { conn, args, command }) => {
  try {
    // SOLO ROOT OWNERS pueden usar esto
    const rownersJid = (global.getROwnersJid?.() || [])
    const sender = conn.decodeJid ? conn.decodeJid(m.sender) : m.sender
    if (!rownersJid.includes(sender)) return

    if (!args[0]) return m.reply('❌ Mencioná a alguien para dar/quitar owner.')
    let target = m.mentionedJid?.[0] || args[0].replace(/[^0-9]/g,'') + '@s.whatsapp.net'

    // Normaliza arrays
    global.owner = global.owner || []

    if (command === 'aowner') {
      if (!global.owner.includes(target.replace(/@s\.whatsapp\.net/,'') )) {
        global.owner.push(target.replace(/@s\.whatsapp\.net/,''))
        return m.reply(`✅ @${target.split('@')[0]} ahora es owner`, { mentions: [target] })
      }
      return m.reply('⚠️ Ya es owner')
    }

    if (command === 'downer') {
      const index = global.owner.indexOf(target.replace(/@s\.whatsapp\.net/,''))
      if (index > -1) {
        global.owner.splice(index,1)
        return m.reply(`⚠️ @${target.split('@')[0]} dejó de ser owner`, { mentions: [target] })
      }
      return m.reply('⚠️ No era owner')
    }

  } catch (e) {
    console.error(e)
    m.reply('⚠️ Ocurrió un error.')
  }
}

handler.command = ['aowner','downer']
handler.rowner = true
handler.group = false
handler.tags = ['owner']
export default handler
