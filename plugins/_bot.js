let requests = {}        // solicitudes activas
let lastRequestTime = {} // antispam por usuario

let handler = async (m, { conn, text, isOwner }) => {
  const botNumber = conn.user.id.split("@")[0]

  if (!text) {
    return conn.sendMessage(
      m.chat,
      { text: "🤖 Escribí un mensaje para la IA." },
      { quoted: m }
    )
  }

  // ✅ ANTISPAM 30s
  if (
    lastRequestTime[m.sender] &&
    Date.now() - lastRequestTime[m.sender] < 30000 &&
    !isOwner
  ) {
    const remainingTime = Math.ceil(
      (30000 - (Date.now() - lastRequestTime[m.sender])) / 1000
    )
    return conn.sendMessage(
      m.chat,
      { text: `*[❗]* Esperá ${remainingTime} segundos para usar nuevamente.` },
      { quoted: m }
    )
  }

  lastRequestTime[m.sender] = Date.now()

  await conn.sendPresenceUpdate("composing", m.chat)

  // ✅ MENSAJE A LA IA CON IDENTIFICADOR
  const sendMsg = `prompt: cada mensaje que se te envía pertenece a un identificador único. En absolutamente todas tus respuestas, pondrás al comienzo de tu respuesta: identificador: y aqui el identificador.

Mensaje del identificador: ${m.key.id}
Mensaje: ${text}`

  // ✅ GUARDAR SOLICITUD
  requests[m.key.id] = {
    user: m.sender,
    chat: m.chat,
    originalMessage: m,
  }

  // ✅ TIMEOUT 2 MIN
  setTimeout(() => {
    if (requests[m.key.id]) {
      delete requests[m.key.id]
      conn.sendMessage(
        m.chat,
        { text: "❌ La IA no respondió a tiempo." },
        { quoted: m }
      )
    }
  }, 120000)

  // ✅ ENVIAR A NÚMERO IA
  await conn.sendMessage("18002428478@s.whatsapp.net", { text: sendMsg })
}

// ✅ COMANDOS
handler.command = [
  "ia",
  "chatgpt",
  "bot",
  "ia2",
  "chatgpt2",
  "bot2"
]

handler.botAdmin = true

// ✅ INTERCEPTAR RESPUESTAS DE LA IA
handler.before = async function (m, { conn }) {
  if (m.sender !== "18002428478@s.whatsapp.net") return
  if (!m.text) return

  let match = m.text.match(/^identificador:\s*([^\n]+)\n([\s\S]+)/i)
  if (!match) return

  let requestId = match[1].trim()
  let iaResponse = match[2].trim()

  if (requests[requestId]) {
    let { chat, originalMessage } = requests[requestId]

    await conn.sendMessage(
      chat,
      { text: iaResponse },
      { quoted: originalMessage }
    )

    delete requests[requestId]
  }
}

export default handler
