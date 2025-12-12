// 📂 plugins/grupos-llamar.js — FelixCat_Bot 🐾
// FIX: .cancelar muestra solo SU mensaje, no el del comando llamar

const owners = ["59896026646@s.whatsapp.net", "59898719147@s.whatsapp.net"]

let activeCalls = {}

let handler = async (m, { conn, text, command, args }) => {
  const chatId = m.chat
  const sender = m.sender

  if (!owners.includes(sender)) return

  // ===============================
  // COMANDO LLAMAR
  // ===============================
  if (command === "llamar") {

    if (!m.isGroup)
      return m.reply("❌ *Este comando solo funciona en grupos.*")

    let target = m.mentionedJid?.[0]
    if (typeof target !== "string")
      return m.reply("⚠️ Debes mencionar a alguien.\nEjemplo: *.llamar @usuario*")

    if (activeCalls[chatId]?.running)
      return m.reply("⚠️ Ya hay una llamada en curso.\nUsa *.cancelar* para detenerla.")

    const total = parseInt(args[1]) || 10
    const intervalo = parseInt(args[2]) || 5

    activeCalls[chatId] = {
      running: true,
      target: target
    }

    m.reply(
      `📞 *Llamada iniciada*\n👉 Usuario: @${target.split("@")[0]}\n🔢 Repeticiones: *${total}*\n⏳ Intervalo: *${intervalo}s*\n\n🛑 Usa *.cancelar* para detener.`,
      { mentions: [target] }
    )

    // LOOP
    for (let i = 0; i < total; i++) {

      // SI SE CANCELÓ → NO MANDAR MENSAJE ADICIONAL
      if (!activeCalls[chatId]?.running) {
        delete activeCalls[chatId]
        return // ← NO RESPONDE NADA AQUÍ
      }

      try {
        await conn.sendMessage(chatId, {
          text: `📞 *LLAMADA #${i + 1}*\n➡️ @${target.split("@")[0]}`,
          mentions: [target]
        })
      } catch (err) {
        console.log("Error enviando llamada:", err)
        break
      }

      await new Promise(r => setTimeout(r, intervalo * 1000))
    }

    delete activeCalls[chatId]
    return m.reply("✅ *Llamadas finalizadas.*")
  }

  // ===============================
  // COMANDO CANCELAR
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
