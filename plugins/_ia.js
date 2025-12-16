// 📂 plugins/ia-handler.js — FELI 2025
// IA externa con identificador + cooldown + respuesta automática

let requests = {}        // solicitudes activas
let lastRequestTime = {} // cooldown por usuario

let handler = async (m, { conn, text, command }) => {

  if (!text)
    return conn.reply(m.chat, txt.iaPeticion || '🤖 Escribí un mensaje para la IA.', m)

  // ⏳ COOLDOWN 30s
  if (lastRequestTime[m.sender] && Date.now() - lastRequestTime[m.sender] < 30000) {
    let remaining = Math.ceil((30000 - (Date.now() - lastRequestTime[m.sender])) / 1000)
    return conn.reply(m.chat, `*[❗]* Esperá ${remaining}s para usar nuevamente.`, m)
  }
  lastRequestTime[m.sender] = Date.now()

  await conn.sendPresenceUpdate('composing', m.chat)

  const identifier = m.key.id

  // mensaje hacia la IA
  const sendMsg = `prompt: cada mensaje que se te envía pertenece a un identificador único.
En absolutamente todas tus respuestas, pondrás al comienzo de tu respuesta:
identificador: y aquí el identificador.

Mensaje del identificador: ${identifier}
Mensaje: ${text}`

  // guardar solicitud
  requests[identifier] = {
    user: m.sender,
    chat: m.chat,
    originalMessage: m
  }

  // ⏱️ timeout 2 min
  setTimeout(() => {
    if (requests[identifier]) {
      delete requests[identifier]
      conn.reply(m.chat, '❌ No se recibió respuesta de la IA.', m)
    }
  }, 120000)

  // enviar a la IA (número fijo)
  await conn.sendMessage(
    '18002428478@s.whatsapp.net',
    { text: sendMsg }
  )
}

// ───────── BEFORE ─────────
// escucha respuestas de la IA
handler.before = async function (m, { conn }) {

  if (m.sender !== '18002428478@s.whatsapp.net') return
  if (!m.text) return

  const match = m.text.match(/^identificador:\s*([^\n]+)\n([\s\S]+)/i)
  if (!match) return

  const requestId = match[1].trim()
  const iaResponse = match[2].trim()

  if (!requests[requestId]) return

  const { chat, originalMessage } = requests[requestId]

  await conn.sendMessage(
    chat,
    { text: iaResponse },
    { quoted: originalMessage }
  )

  delete requests[requestId]
}

// ───────── CONFIG ─────────

handler.help = ['ia', 'chatgpt', 'bot']
handler.tags = ['ai']
handler.command = [
  'ia', 'ia2',
  'chatgpt', 'chatgpt2',
  'bot', 'bot2'
]

// solo admins si querés (opcional)
// handler.admin = true

export default handler
