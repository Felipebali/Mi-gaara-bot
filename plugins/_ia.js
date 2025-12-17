const requests = {}
const lastRequestTime = {}

function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "")
}

let handler = async (m, { conn, text, command }) => {
  try {
    const senderNum = cleanNum(m.sender)
    const iaNum = "18002428478"

    // ═══════════════════════════════════════
    // 📥 RESPUESTA DE LA IA
    // ═══════════════════════════════════════
    if (senderNum === iaNum) {
      const msg = m.text || ""
      const match = msg.match(/^identificador:\s*([^\n]+)\n([\s\S]+)/i)
      if (!match) return

      const requestId = match[1].trim()
      const response = match[2].trim()

      if (!requests[requestId]) return

      const { chat, originalMessage } = requests[requestId]
      delete requests[requestId]

      await conn.sendMessage(chat, { text: response }, { quoted: originalMessage })
      return
    }

    // ═══════════════════════════════════════
    // 🧠 COMANDO .ia
    // ═══════════════════════════════════════
    if (!text) {
      return conn.reply(
        m.chat,
        "❌ Escribí una pregunta.\n\nEjemplo:\n.ia ¿Qué es la relatividad?",
        m
      )
    }

    // ⏱️ Cooldown 30s
    if (lastRequestTime[m.sender] && Date.now() - lastRequestTime[m.sender] < 30000) {
      const s = Math.ceil((30000 - (Date.now() - lastRequestTime[m.sender])) / 1000)
      return conn.reply(m.chat, `⏱️ Esperá ${s}s para volver a usar la IA.`, m)
    }
    lastRequestTime[m.sender] = Date.now()

    await conn.sendPresenceUpdate("composing", m.chat)

    const requestId = m.key.id

    requests[requestId] = {
      chat: m.chat,
      originalMessage: m
    }

    const prompt = `Cada respuesta DEBE comenzar con:
identificador: ${requestId}

Mensaje:
${text}`

    await conn.sendMessage("18002428478@s.whatsapp.net", { text: prompt })

    // ⏳ Timeout 120s
    setTimeout(() => {
      if (requests[requestId]) {
        delete requests[requestId]
        conn.reply(m.chat, "⏱️ La IA no respondió a tiempo.", m)
      }
    }, 120000)

  } catch (e) {
    console.error("❌ IA error:", e)
  }
}

handler.command = ["ia", "chatgpt", "bot", "ia2", "chatgpt2", "bot2"]
export default handler
