// 📂 plugins/propietario-kickall.js — FELI 2025 — KICKALL SILENCIOSO 3.5s 🔇

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

const TARGET_GROUP = '120363420369650074@g.us'
const INTERVAL = 3500 // ⏱️ 3,5 segundos

const handler = async (m, { conn }) => {

  if (!m.isGroup) return
  if (m.chat !== TARGET_GROUP) return

  try {
    const meta = await conn.groupMetadata(m.chat)

    const isBotAdmin = meta.participants.some(p =>
      p.id === conn.user.id && p.admin
    )
    if (!isBotAdmin) return

    for (const p of meta.participants) {

      // No expulsar al bot
      if (p.id === conn.user.id) continue

      await sleep(INTERVAL)
      await conn.groupParticipantsUpdate(m.chat, [p.id], 'remove')
    }

  } catch {}
}

// ================= CONFIG =================
handler.help = ['kickall']
handler.tags = ['owner']
handler.command = ['kickall']
handler.rowner = true

export default handler
