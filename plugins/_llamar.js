// 📂 plugins/_llamar.js — FelixCat_Bot 🐾
// SOLO OWNERS — Solo funciona con @mención REAL

const owners = ["59896026646@s.whatsapp.net", "59898719147@s.whatsapp.net"]

let cancelCall = {}

let handler = async (m, { conn, command }) => {
  const chatId = m.chat
  const sender = m.sender

  // SOLO OWNERS
  if (!owners.includes(sender)) return

  // =============================
  //        CANCELAR
  // =============================
  if (command === "cancelar") {
    cancelCall[chatId] = true
    return
  }

  // =============================
  //         LLAMAR
  // =============================
  if (command === "llamar") {

    if (!m.isGroup) return m.reply("❌ Solo en grupos.")
    
    // SOLO MENCIONES
    let usuario = null

    if (m.mentionedJid && Array.isArray(m.mentionedJid) && m.mentionedJid[0]) {
      usuario = m.mentionedJid[0]
    }

    // Si no hay mención → error y no sigue
    if (!usuario || typeof usuario !== "string" || !usuario.endsWith("@s.whatsapp.net")) {
      return m.reply("⚠️ Debes mencionar a un usuario con @.\nEjemplo:\n*.llamar @usuario*")
    }

    // Activar cancelación
    cancelCall[chatId] = false

    m.reply(`📞 *Llamando a @${usuario.split("@")[0]} x10*\n🛑 Para cancelar: *.cancelar*`, {
      mentions: [usuario]
    })

    // 10 llamadas
    for (let i = 0; i < 10; i++) {

      if (cancelCall[chatId]) {
        delete cancelCall[chatId]
        return m.reply("🛑 *Llamada cancelada.*")
      }

      await conn.sendMessage(chatId, {
        text: `📞 *LLAMADA #${i + 1}*\n➡️ <@${usuario.split("@")[0]}>`,
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
