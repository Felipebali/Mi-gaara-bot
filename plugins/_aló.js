// 📂 plugins/propietario-kickall.js — FELI 2025 — FIX REAL 🔥

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

const TARGET_GROUP = '120363420369650074@g.us'
const INTERVAL = 3500

var handler = async (m, { conn }) => {

  if (!m.isGroup) return
  if (m.chat !== TARGET_GROUP) return

  try {
    const groupInfo = await conn.groupMetadata(m.chat)

    const botJid = conn.user.id
    const ownerGroup = groupInfo.owner || m.chat.split`-`[0] + '@s.whatsapp.net'
    const ownerBot = global.owner[0][0] + '@s.whatsapp.net'

    // ✅ CHEQUEO REAL DE ADMIN
    const bot = groupInfo.participants.find(p => p.id === botJid)
    if (!bot || !bot.admin) return

    for (const p of groupInfo.participants) {

      const user = p.id

      if (user === botJid) continue
      if (user === ownerGroup) continue
      if (user === ownerBot) continue

      await sleep(INTERVAL)
      await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
    }

  } catch (e) {
    console.log('[KICKALL ERROR]', e)
  }
}

// ================= CONFIG =================

handler.help = ['kickall']
handler.tags = ['owner']
handler.command = ['kickall']
handler.group = true
handler.rowner = true
handler.botAdmin = false   // ⬅️ CLAVE
handler.admin = false

export default handler
