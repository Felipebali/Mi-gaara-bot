// 🤖 IA GRATIS REAL — FELI 2025
// Comando: .bot pregunta
// IA online SIN API KEY

import fetch from 'node-fetch'

let cooldown = {}

const handler = async (m, { conn, text, command }) => {
  try {
    if (!text)
      return conn.reply(
        m.chat,
        '🤖 Usá:\n\n.bot <pregunta>',
        m
      )

    // ⏳ Cooldown 5s por chat
    if (cooldown[m.chat] && Date.now() - cooldown[m.chat] < 5000)
      return conn.reply(m.chat, '⏳ Esperá un poco...', m)

    cooldown[m.chat] = Date.now()

    await conn.sendPresenceUpdate('composing', m.chat)

    // 🌐 IA GRATIS
    const res = await fetch(
      `https://api.simsimi.net/v2/?text=${encodeURIComponent(text)}&lc=es`
    )
    const json = await res.json()

    let reply = json.success || '🤖 No sé qué responder 😅'

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
handler.help = ['bot <pregunta>']
handler.tags = ['ia']

export default handler
