// 📂 plugins/propietario-kickall.js — FELI 2025 — KICKALL SILENCIOSO 3.5s 🔇

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function normalize(jid = '') {
  return jid.split(':')[0]
}

const TARGET_GROUP = '120363420369650074@g.us'
const INTERVAL = 3500 // ⏱️ 3,5 segundos

const handler = async (m, { conn }) => {

  if (!m.isGroup) return
  if (m.chat !== TARGET_GROUP) return

  try {
    const meta = await conn.groupMetadata(m.chat)

    const botId = normalize(conn.user.id)

    const isBotAdmin = meta.participants.some(p =>
      normalize(p.id) === botId &&
      (p.admin === 'admin' || p.admin === 'superadmin')
    )

    if (!isBotAdmin) return

    for (const p of meta.participants) {

      const pid = normalize(p.id)

      // No expulsar al bot
      if (pid === botId) continue

      await sleep(INTERVAL)
      await conn.groupParticipantsUpdate(m.chat, [pid], 'remove')
    }

  } catch (e) {
    console.log('KICKALL ERROR:', e)
  }
}

// ================= CONFIG =================
handler.help = ['kickall']
handler.tags = ['owner']
handler.command = ['kickall']
handler.rowner = true

export default handler
