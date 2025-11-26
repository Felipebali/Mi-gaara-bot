import baileys from '@whiskeysockets/baileys'
import * as fs from 'fs'
const { generateWAMessageFromContent } = baileys

const imagen1 = fs.readFileSync('./media/thumbnail.jpg')
const md = 'https://youtube.com'

const handler = async (m, { conn, text }) => {
  try {
    // OBTENER PARTICIPANTES DIRECTAMENTE DESDE EL GRUPO
    const group = await conn.groupMetadata(m.chat)
    const users = group.participants.map(v => v.id)

    if (!text && !m.quoted) {
      return conn.reply(m.chat, '🐉 Debes enviar un texto o responder un mensaje.', m)
    }

    // Mensaje base
    const mensaje = text || (m.quoted?.text || '')

    // Enviar tag
    await conn.sendMessage(
      m.chat,
      {
        text: mensaje,
        mentions: users
      },
      { quoted: m }
    )

  } catch (e) {
    console.log('Error en Tag:', e)
    return conn.reply(m.chat, '⚠️ Error al enviar el tag.', m)
  }
}

handler.command = ['tag']
handler.group = true
handler.admin = true
handler.help = ['tag']
handler.tags = ['grupo']

export default handler
