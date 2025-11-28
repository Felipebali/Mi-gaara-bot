// 📂 plugins/grupos-setpg.js — Cambiar foto del GRUPO
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

// 🔥 Owners globales
const OWNERS = ['59896026646', '59898719147']

let handler = async (m, { conn, isAdmin, isOwner }) => {
  try {
    if (!m.isGroup)
      return m.reply('❌ Este comando solo funciona en grupos.')

    const sender = m.sender.replace(/[^0-9]/g, '')
    const isOwnerUser = OWNERS.includes(sender)

    // 🔒 Solo admins u owners
    if (!isAdmin && !isOwnerUser) {
      return m.reply('❌ Solo *admins* o *owners* pueden cambiar la foto del grupo.')
    }

    // 📸 Debe venir citando una imagen
    const q = m.quoted
    if (!q) return m.reply('📸 *Debes responder a una imagen* con el comando:\n\n.setpg')

    const mime = q.mimetype || (q.msg && q.msg.mimetype) || ''
    if (!mime.startsWith('image/'))
      return m.reply('📸 *Responde a una imagen válida* para usar .setpg')

    // 📥 Descargar imagen
    const stream = await downloadContentFromMessage(q, 'image')
    let buffer = Buffer.from([])

    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }

    // 🔧 Cambiar foto del grupo
    await conn.query({
      tag: 'iq',
      attrs: {
        type: 'set',
        xmlns: 'w:profile:picture',
        to: m.chat
      },
      content: [{
        tag: 'picture',
        attrs: { type: 'image' },
        content: buffer
      }]
    })

    await m.reply('✅ *Foto del grupo actualizada correctamente.*')

  } catch (e) {
    console.error(e)
    m.reply('❌ Hubo un error al cambiar la foto del grupo.')
  }
}

handler.help = ['setpg']
handler.tags = ['grupo']
handler.command = /^setpg$/i

export default handler 
