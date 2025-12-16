// 🤖 IA REAL GRATIS — FELI 2025
// Comando: .bot pregunta
// BrainShop AI (JSON seguro)

import fetch from 'node-fetch'

let cooldown = {}

const handler = async (m, { conn, text }) => {
  try {
    if (!text)
      return conn.reply(m.chat, '🤖 Usá:\n\n.bot <pregunta>', m)

    // ⏳ Cooldown 5s
    if (cooldown[m.chat] && Date.now() - cooldown[m.chat] < 5000)
      return conn.reply(m.chat, '⏳ Esperá un poco...', m)

    cooldown[m.chat] = Date.now()

    await conn.sendPresenceUpdate('composing', m.chat)

    // 🌐 IA GRATIS (JSON REAL)
    const url = `https://api.brainshop.ai/get?bid=178&key=7fIY0ZQ7y3U3e0Vh&uid=${m.sender}&msg=${encodeURIComponent(text)}`
    const res = await fetch(url)
    const json = await res.json()

    const reply = json.cnt || '🤖 No pude responder eso.'

    await conn.sendMessage(
      m.chat,
      { text: `🤖 *Bot IA:*\n\n${reply}` },
      { quoted: m }
    )

  } catch (e) {
    console.error(e)
    conn.reply(m.chat, '❌ Error en la IA', m)
  }
}

handler.command = ['bot']
handler.tags = ['ia']
handler.help = ['bot <pregunta>']

export default handler
