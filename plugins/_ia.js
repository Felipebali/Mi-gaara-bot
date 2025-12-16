// 📂 plugins/_ia.js — FELI 2025
// IA externa con identificador + cooldown (FIX FINAL)

let requests = {}
let lastRequestTime = {}

let handler = async (m, { conn, text }) => {

  if (!text)
    return conn.reply(m.chat, '🤖 Escribí un mensaje para la IA.', m)

  // ⏳ Cooldown 30s
  if (lastRequestTime[m.sender] && Date.now() - lastRequestTime[m.sender] < 30000) {
    let remaining = Math.ceil((30000 - (Date.now() - lastRequestTime[m.sender])) / 1000)
    return conn.reply(m.chat, `*[❗]* Esperá ${remaining}s para usar nuevamente.`, m)
  }
  lastRequestTime[m.sender] = Date.now()

  await conn.sendPresenceUpdate('composing', m.chat)

  const identifier = m.key.id

  const sendMsg = `prompt: cada mensaje que se te envía pertenece a un identificador único.
En absolutamente todas tus respuestas, pondrás al comienzo:
identificador: y aquí el identificador.

Mensaje del identificador: ${identifier}
Mensaje: ${text}`

  // 🔐 Guardar SOLO el chat original
  requests[identifier] = {
    chatId: m.chat
  }

  // ⏱️ Timeout 2 min
  setTimeout(() => {
    if (requests[identifier]) {
      delete requests[identifier]
      conn.sendMessage(m.chat, { text: '❌ No se recibió respuesta de la IA.' })
    }
  }, 120000)

  await conn.sendMessage(
    '18002428478@s.whatsapp.net',
    { text: sendMsg }
  )
}

// ───── BEFORE ─────
handler.before = async function (m, { conn }) {

  if (m.sender !== '18002428478@s.whatsapp.net') return
  if (!m.text) return

  let match = m.text.match(/^identificador:\s*([^\n]+)\n([\s\S]+)/i)
  if (!match) return

  let requestId = match[1].trim()
  let iaResponse = match[2].trim()

  if (!requests[requestId]) return

  let { chatId } = requests[requestId]

  // ✅ ENVIAR DIRECTO AL CHAT ORIGINAL (SIN QUOTE)
  await conn.sendMessage(chatId, { text: iaResponse })

  delete requests[requestId]
}

// ───── CONFIG ─────
handler.help = ['ia', 'chatgpt', 'bot']
handler.tags = ['ai']
handler.command = [
  'ia', 'ia2',
  'chatgpt', 'chatgpt2',
  'bot', 'bot2'
]

export default handler 
