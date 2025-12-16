// 🤖 IA TRIGGER — FELI 2025
// Responde cuando escriben: bot | ia | bot2

import fetch from 'node-fetch'

const BOT_JID = '18002428478@s.whatsapp.net'
const TRIGGERS = ['bot', 'ia', 'bot2']

let cooldown = {}

export async function before(m, { conn }) {
  try {
    if (!m.text) return
    if (m.fromMe) return

    // Solo si el mensaje menciona el bot o palabras clave
    const text = m.text.toLowerCase()
    const called =
      TRIGGERS.some(w => text.startsWith(w)) ||
      m.mentionedJid?.includes(BOT_JID)

    if (!called) return

    // Cooldown por chat (5s)
    if (cooldown[m.chat] && Date.now() - cooldown[m.chat] < 5000) return
    cooldown[m.chat] = Date.now()

    // Limpiar texto (sacar "bot", "ia", etc)
    let question = text
      .replace(/^bot/i, '')
      .replace(/^ia/i, '')
      .replace(/^bot2/i, '')
      .trim()

    if (!question)
      return conn.reply(m.chat, '🤖 Decime qué querés saber.', m)

    // 🔮 RESPUESTA IA (ejemplo)
    const reply = await fakeIA(question)

    await conn.sendMessage(m.chat, { text: reply }, { quoted: m })

  } catch (e) {
    console.error(e)
  }
}

// 🧠 IA SIMPLE (podés reemplazar por API real)
async function fakeIA(text) {
  return `🤖 *IA RESPONDE:*\n\n${text}\n\n✨ (respuesta generada)`
}
