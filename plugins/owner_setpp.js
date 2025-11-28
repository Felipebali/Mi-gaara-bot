// 📂 plugins/propietario-setpp.js
// Cambiar foto de perfil del BOT — Solo Owners

import { downloadContentFromMessage } from '@whiskeysockets/baileys'

// 📌 Owners en formato array (solo números)
const OWNERS = [
  '59896026646',
  '59898719147'
]

let handler = async (m, { conn }) => {
  try {

    // 📌 ID del autor en formato limpio
    const sender = m.sender.replace(/[^0-9]/g, '')

    // 🔐 Validación de OWNER
    if (!OWNERS.includes(sender)) {
      return m.reply('❌ Solo los *owners* pueden cambiar la foto del bot.')
    }

    // 🖼️ Verificar si el mensaje contiene o cita una imagen
    const q = m.quoted || m
    const mime = (q.msg || q).mimetype || ''

    if (!mime.startsWith('image/')) {
      return m.reply(
        '📸 *Debes responder a una imagen* para usar:\n\n.setpp'
      )
    }

    // 📥 Descargar imagen del mensaje
    const stream = await downloadContentFromMessage(q.msg || q, 'image')
    let buffer = Buffer.from([])

    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }

    // 🔄 Cambiar foto de perfil del BOT
    await conn.updateProfilePicture(conn.user.jid, buffer)

    // ✔️ Confirmación
    m.reply('✅ *Foto de perfil del bot actualizada correctamente.*')

  } catch (err) {
    console.error(err)
    m.reply('❌ Error al intentar cambiar la foto de perfil.')
  }
}

handler.help = ['setpp']
handler.tags = ['owner']
handler.command = /^(setpp|cambiarpp|botpp)$/i
handler.owner = true

export default handler
