// 🤖 IA LIMPIA — FELI 2025
// Comando: .bot pregunta
// IA gratuita, respuestas naturales

import fetch from 'node-fetch'

let cooldown = {}

const handler = async (m, { conn, text }) => {
  try {
    if (!text)
      return conn.reply(m.chat, '🤖 Escribí algo después de .bot', m)

    // ⏳ Cooldown 5 segundos
    if (cooldown[m.chat] && Date.now() - cooldown[m.chat] < 5000)
      return

    cooldown[m.chat] = Date.now()

    await conn.sendPresenceUpdate('composing', m.chat)

    const res = await fetch(
      `https://api.brainshop.ai/get?bid=178&key=7fIY0ZQ7y3U3e0Vh&uid=chat&msg=${encodeURIComponent(text)}`
    )

    const data = await res.json()

    let reply = data.cnt || 'No tengo una respuesta ahora mismo.'

    await conn.sendMessage(
      m.chat,
      { text: reply },
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
