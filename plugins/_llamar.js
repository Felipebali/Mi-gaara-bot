// 📂 plugins/grupos-llamar.js — FelixCat_Bot 🐾
// .llamar @usuario → llama varias veces con intervalo configurable
// .cancelar → corta la llamada al instante

const owners = ["59896026646@s.whatsapp.net", "59898719147@s.whatsapp.net"]

// Control de llamadas activas por chat
let activeCalls = {}

let handler = async (m, { conn, text, command, args }) => {
  const chatId = m.chat
  const sender = m.sender

  // ===============================
  // PERMISOS — SOLO OWNERS
  // ===============================
  if (!owners.includes(sender)) return

  // ===============================
  // COMANDO LLAMAR
  // ===============================
  if (command === "llamar") {
    if (!m.isGroup)
      return m.reply("❌ *Este comando solo funciona en grupos.*")

    const target = m.mentionedJid?.[0]
    if (!target)
      return m.reply("⚠️ Debes mencionar a alguien.\nEjemplo: *.llamar @usuario*")

    // Evitar llamadas simultáneas
    if (activeCalls[chatId]?.running)
      return m.reply("⚠️ Ya hay una llamada en curso.\nUsa *.cancelar* para detenerla.")

    // Configuración flexible
    const total = Math.min(parseInt(args[1]) || 10, 50)
    const intervalo = Math.max(1, Math.min(parseInt(args[2]) || 5, 60))

    activeCalls[chatId] = {
      running: true,
      target,
      index: 0
    }

    m.reply(
      `📞 *Llamada iniciada*\n` +
      `👤 Usuario: @${target.split("@")[0]}\n` +
      `🔢 Repeticiones: *${total}*\n` +
      `⏳ Intervalo: *${intervalo}s*\n\n` +
      `🛑 Usa *.cancelar* para detener inmediatamente.`,
      { mentions: [target] }
    )

    // ===============================
    // LOOP DE LLAMADAS
    // ===============================
    for (let i = 0; i < total; i++) {

      // Si se canceló →
      if (!activeCalls[chatId]?.running) {
        delete activeCalls[chatId]
        return m.reply("🛑 *Llamada cancelada.*")
      }

      try {
        await conn.sendMessage(chatId, {
          text: `📞 *LLAMADA #${i + 1}*\n➡️ @${target.split("@")[0]}`,
          mentions: [target]
        })
      } catch (e) {
        console.error("Error enviando llamada:", e)
      }

      await new Promise(r => setTimeout(r, intervalo * 1000))
    }

    delete activeCalls[chatId]
    return m.reply("✅ *Llamadas finalizadas.*")
  }

  // ===============================
  // COMANDO CANCELAR (INSTANTÁNEO)
  // ===============================
  if (command === "cancelar") {
    if (!activeCalls[chatId]?.running)
      return m.reply("⚠️ No hay ninguna llamada activa en este grupo.")

    // CORTAR YA MISMO
    activeCalls[chatId].running = false

    return m.reply("🛑 *Llamada cancelada.*")
  }
}

handler.help = ["llamar @usuario (veces) (intervalo)", "cancelar"]
handler.tags = ["owner"]
handler.command = /^(llamar|cancelar)$/i

export default handler
