// 📂 plugins/propietario-setpp.js
// Cambia la foto de perfil del BOT — Solo Owners

import { downloadContentFromMessage } from '@whiskeysockets/baileys'

const owners = ['59896026646', '59898719147'] // ← SOLO NÚMEROS

let handler = async (m, { conn }) => {
  try {

    const sender = m.sender.replace(/[^0-9]/g, '')

    // 🔐 SOLO OWNERS
    if (!owners.includes(sender)) {
      return m.reply("❌ Solo los *owners* pueden cambiar la foto de perfil del bot.")
    }

    // 📸 Verificar si viene una imagen
    const q = m.quoted || m
    const mime = (q.msg || q).mimetype || ''

    if (!mime || !mime.startsWith('image/')) {
      return m.reply("📸 *Responde a una imagen* con el comando:\n\n.setpp")
    }

    // 📥 Descargar imagen
    const stream = await downloadContentFromMessage(q.msg || q, 'image')
    let buffer = Buffer.from([])

    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }

    // 🔄 Cambiar foto del bot
    await conn.updateProfilePicture(conn.user.jid, buffer)

    m.reply("✅ *Foto de perfil del bot actualizada correctamente.*")

  } catch (e) {
    console.error(e)
    m.reply("❌ Error al intentar cambiar la foto de perfil.")
  }
}

handler.help = ['setpp']
handler.tags = ['owner']
handler.command = /^(setpp|cambiarpp|botpp)$/i
handler.owner = true

export default handler 
