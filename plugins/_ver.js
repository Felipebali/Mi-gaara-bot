// 📂 plugins/_ver.js — FelixCat-Bot 🐾
// Recupera fotos, videos o stickers en su formato original
// Solo los owners pueden usarlo 👑

import { webp2png } from '../lib/webp2mp4.js'

let handler = async (m, { conn }) => {
  // --- NORMALIZA NÚMEROS ---
  const owners = global.owner.map(o => o[0].replace(/[^0-9]/g, ''))
  const senderNumber = m.sender.replace(/[^0-9]/g, '')

  // --- SOLO OWNERS ---
  if (!owners.includes(senderNumber)) {
    await m.react('✖️')
    return conn.reply(m.chat, '❌ Solo los *owners* pueden usar este comando.', m)
  }

  try {
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || q.mediaType || ''

    if (!/webp|image|video/g.test(mime))
      return conn.reply(m.chat, '⚠️ Responde a una *imagen, sticker o video* para verlo.', m)

    await m.react('📥')

    const buffer = await q.download()
    let sentMessage = null  // <-- aquí guardaremos el mensaje reenviado

    // 🖼️ Si es sticker → convertir a PNG
    if (/webp/.test(mime)) {
      const result = await webp2png(buffer)

      if (result && result.url) {
        sentMessage = await conn.sendMessage(
          m.chat,
          {
            image: { url: result.url },
            caption: '🖼️ Sticker convertido a imagen.'
          },
          { quoted: m }
        )
        await conn.sendMessage(m.chat, { react: { text: '✅', key: sentMessage.key }} )
        return
      }
    }

    // 🎥 Imagen o video normal: enviarlo directamente
    sentMessage = await conn.sendMessage(
      m.chat,
      {
        [mime.split('/')[0]]: buffer,
        fileName: 'recuperado.' + mime.split('/')[1],
        caption: '📸 Archivo recuperado.'
      },
      { quoted: m }
    )

    // ✅ Reacción al archivo recuperado
    await conn.sendMessage(m.chat, {
      react: {
        text: '✅',
        key: sentMessage.key
      }
    })

  } catch (e) {
    console.error(e)
    await conn.reply(m.chat, '⚠️ Error al recuperar el archivo.', m)
    await m.react('✖️')
  }
}

handler.help = ['ver']
handler.tags = ['tools', 'owner']
handler.command = ['ver', 'r']

export default handler
