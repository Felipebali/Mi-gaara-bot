// 📂 plugins/_llamar.js — FelixCat_Bot 🐾
// Comando .llamar solo owners + cancelar seguro

const owners = ["59896026646@s.whatsapp.net", "59898719147@s.whatsapp.net"]
let cancelCall = {}

let handler = async (m, { conn, text, command }) => {
  const chatId = m.chat
  const sender = m.sender

  // Solo owners siempre
  if (!owners.includes(sender)) return

  // ==================================
  //         CANCELAR
  // ==================================
  if (command === "cancelar") {
    cancelCall[chatId] = true
    return
  }

  // ==================================
  //          LLAMAR
  // ==================================
  if (command === "llamar") {
    if (!m.isGroup)
      return m.reply("❌ Este comando solo funciona en grupos.")

    // Extraer JID del usuario mencionado
    let usuario = (
      m.mentionedJid && 
      Array.isArray(m.mentionedJid) && 
      m.mentionedJid[0]
    ) ? m.mentionedJid[0] : null

    // Validación fuerte
    if (!usuario || typeof usuario !== "string" || !usuario.includes("@s.whatsapp.net"))
      return m.reply("⚠️ Debes mencionar correctamente a un usuario.\nEjemplo: *.llamar @usuario*")

    // Iniciar bandera de cancelación
    cancelCall[chatId] = false

    m.reply(`📞 *Llamada iniciada a @${usuario.split("@")[0]}*\n🛑 Escribe *.cancelar* para detener.`, {
      mentions: [usuario]
    })

    // Enviar 10 menciones
    for (let i = 0; i < 10; i++) {

      // CANCELA SI EL OWNER LO ORDENA
      if (cancelCall[chatId]) {
        delete cancelCall[chatId]
        return m.reply("🛑 *Llamada cancelada.*")
      }

      await conn.sendMessage(chatId, {
        text: `📞 *LLAMADA #${i+1}*\n➡️ <@${usuario.split("@")[0]}>`,
        mentions: [usuario]
      })

      await new Promise(r => setTimeout(r, 600))
    }

    delete cancelCall[chatId]
    return
  }
}

handler.command = /^(llamar|cancelar)$/i
handler.tags = ["owner"]
handler.help = ["llamar @usuario", "cancelar"]

export default handler
