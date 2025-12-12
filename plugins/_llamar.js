// 📂 plugins/grupos-llamar.js — FelixCat_Bot 🐾
// FIX DEFINITIVO jid.endsWith

function normalizeJid(jid) {
  if (!jid) return null
  if (typeof jid === "string") {
    if (jid.endsWith("@s.whatsapp.net") || jid.endsWith("@g.us")) return jid
    return jid.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
  }
  if (Array.isArray(jid)) return normalizeJid(jid[0])
  return null
}

const owners = ["59896026646@s.whatsapp.net", "59898719147@s.whatsapp.net"]

let activeCalls = {}

let handler = async (m, { conn, text, command, args }) => {
  const chatId = m.chat
  const sender = m.sender

  if (!owners.includes(sender)) return

  // ===============================
  // LLAMAR
  // ===============================
  if (command === "llamar") {

    if (!m.isGroup)
      return m.reply("❌ *Este comando solo funciona en grupos.*")

    let raw = m.mentionedJid?.[0] || (m.quoted && m.quoted.sender)
    let target = normalizeJid(raw)

    if (!target)
      return m.reply("⚠️ Debes mencionar o citar a alguien.")

    if (activeCalls[chatId]?.running)
      return m.reply("⚠️ Ya hay una llamada en curso.\nUsa *.cancelar* para detenerla.")

    const total = parseInt(args[1]) || 10
    const intervalo = parseInt(args[2]) || 5

    activeCalls[chatId] = { running: true, target }

    m.reply(
      `📞 *Llamada iniciada*\n👉 Usuario: @${target.split("@")[0]}\n🔢 Repeticiones: *${total}*\n⏳ Intervalo: *${intervalo}s*\n\n🛑 Usa *.cancelar* para detener.`,
      { mentions: [target] }
    )

    for (let i = 0; i < total; i++) {
      if (!activeCalls[chatId]?.running) {
        delete activeCalls[chatId]
        return
      }

      await conn.sendMessage(chatId, {
        text: `📞 *LLAMADA #${i + 1}*\n➡️ @${target.split("@")[0]}`,
        mentions: [target]
      })

      await new Promise(r => setTimeout(r, intervalo * 1000))
    }

    delete activeCalls[chatId]
    return m.reply("✅ *Llamadas finalizadas.*")
  }

  // ===============================
  // CANCELAR
  // ===============================
  if (command === "cancelar") {

    if (!activeCalls[chatId]?.running)
      return m.reply("⚠️ No hay ninguna llamada activa.")

    const target = activeCalls[chatId].target
    activeCalls[chatId].running = false

    return m.reply(
      `🛑 *Llamada a @${target.split("@")[0]} cancelada.*`,
      { mentions: [target] }
    )
  }
}

handler.help = ["llamar @usuario (total) (intervalo)", "cancelar"]
handler.tags = ["owner"]
handler.command = /^(llamar|cancelar)$/i
export default handler
