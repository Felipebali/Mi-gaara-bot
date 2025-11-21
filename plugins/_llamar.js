// 📂 plugins/grupos-llamar.js — FelixCat_Bot 🐾
// .llamar @usuario → llama 10 veces con intervalo de 5s
// .cancelar → corta la llamada de inmediato

const owners = ["59896026646@s.whatsapp.net", "59898719147@s.whatsapp.net"]

let cancelCall = {}

let handler = async (m, { conn, text, command }) => {
  const chatId = m.chat
  const sender = m.sender

  // Solo owners siempre
  if (!owners.includes(sender)) return

  // ===============================
  //        COMANDO LLAMAR
  // ===============================
  if (command === "llamar") {
    if (!m.isGroup) return m.reply("❌ Este comando solo funciona en grupos.")

    const usuario = m.mentionedJid?.[0]
    if (!usuario) return m.reply("⚠️ Debes mencionar a alguien.\nEjemplo: *.llamar @usuario*")

    cancelCall[chatId] = false

    m.reply(`📞 *Llamada iniciada a @${usuario.split('@')[0]}*\n🛑 Escribe *.cancelar* para detener.`, {
      mentions: [usuario]
    })

    for (let i = 0; i < 10; i++) {

      // Si se canceló →
      if (cancelCall[chatId]) {
        delete cancelCall[chatId]
        return m.reply("🛑 *Llamada cancelada.*")
      }

      await conn.sendMessage(chatId, {
        text: `📞 *LLAMADA #${i+1}*\n➡️ <@${usuario.split('@')[0]}>`,
        mentions: [usuario]
      })

      // ⏳ Intervalo de 5 segundos
      await new Promise(r => setTimeout(r, 5000))
    }

    delete cancelCall[chatId]
    return
  }

  // ===============================
  //        COMANDO CANCELAR
  // ===============================
  if (command === "cancelar") {
    cancelCall[chatId] = true
    return
  }
}

handler.help = ["llamar @usuario", "cancelar"]
handler.tags = ["owner"]
handler.command = /^(llamar|cancelar)$/i

export default handler
