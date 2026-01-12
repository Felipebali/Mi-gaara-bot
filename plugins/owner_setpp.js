// 📂 plugins/propietario-setpp.js
// Cambiar la foto de perfil del BOT citando una imagen — Solo Owners

import { downloadContentFromMessage } from "@whiskeysockets/baileys";

let handler = async (m, { conn }) => {
  try {

    // 🧠 Obtener owners desde la config principal
    let owners = global.owner?.map(v => v.toString()) || []

    // 🧾 Normalizar número del que ejecuta
    let sender = m.sender.replace(/[^0-9]/g, "")

    // 🔐 SOLO OWNERS
    if (!owners.includes(sender)) return

    // 📸 DEBE ser una imagen CITADA
    if (!m.quoted) {
      return m.reply("📸 *Debes responder a una imagen* con:\n\n.setpp");
    }

    const q = m.quoted
    const mime = (q.msg || q).mimetype || ""

    if (!mime.startsWith("image/")) {
      return m.reply("📸 *Debes citar una imagen válida*.");
    }

    // 📥 Descargar imagen citada
    const stream = await downloadContentFromMessage(q.msg || q, "image")
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }

    // 🖼️ Establecer foto de perfil del bot
    await conn.updateProfilePicture(conn.user.jid, buffer)

    await m.reply("✅ *Foto de perfil del bot actualizada correctamente!*")

  } catch (e) {
    console.error('Error en propietario-setpp:', e)
    m.reply("⚠️ Error al intentar cambiar la foto del bot.")
  }
}

// Datos del comando
handler.help = ["setpp"]
handler.tags = ["owner"]
handler.command = ['setpp', 'cambiarpp', 'botpp']

handler.owner = true

export default handler
