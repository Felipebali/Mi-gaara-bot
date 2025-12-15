// 📂 plugins/propietario-kickall.js — FELI 2025 — KICKALL SILENCIOSO 3.5s 🔇

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

const TARGET_GROUP = '120363420369650074@g.us'
const INTERVAL = 3500 // ⏱️ 3,5 segundos

var handler = async (m, { conn, participants }) => {

  // Solo grupo específico
  if (!m.isGroup) return
  if (m.chat !== TARGET_GROUP) return

  try {
    const groupInfo = await conn.groupMetadata(m.chat)

    const ownerGroup = groupInfo.owner || m.chat.split`-`[0] + '@s.whatsapp.net'
    const ownerBot = global.owner[0][0] + '@s.whatsapp.net'
    const botJid = conn.user.jid

    // Verificar que el bot sea admin
    const isBotAdmin = groupInfo.participants.some(p =>
      p.id === botJid && (p.admin === 'admin' || p.admin === 'superadmin')
    )
    if (!isBotAdmin) return

    // Expulsión silenciosa uno por uno
    for (const p of groupInfo.participants) {

      const user = p.id

      // Protecciones
      if (user === botJid) continue
      if (user === ownerGroup) continue
      if (user === ownerBot) continue

      await sleep(INTERVAL)
      await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
    }

  } catch (e) {
    console.log('KICKALL ERROR:', e)
  }
}

// ================= CONFIG =================

handler.help = ['kickall']
handler.tags = ['owner']
handler.command = ['kickall']
handler.group = true
handler.admin = false
handler.botAdmin = true
handler.rowner = true

export default handler
