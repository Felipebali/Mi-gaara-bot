// 📂 plugins/_ver.js — FelixCat-Bot 🐾
// ver/r → recupera en grupo
// 🌟 → guarda y envía al privado (sin mostrar en el grupo)

import fs from 'fs'
import path from 'path'
import { webp2png } from '../lib/webp2mp4.js'

let handler = async (m, { conn, command }) => {

  const owners = global.owner.map(o => o[0].replace(/[^0-9]/g, ''))
  const senderNumber = m.sender.replace(/[^0-9]/g, '')

  if (!owners.includes(senderNumber)) {
    await m.react('✖️')
    return conn.reply(m.chat, '❌ Solo owners.', m)
  }

  // ================================================
  // 🌟 DETECTAR REACCIÓN PARA "RR AUTOMÁTICO"
  // ================================================
  if (m.message?.reactionMessage) {
    const reaction = m.message.reactionMessage.text
    const reactedKey = m.message.reactionMessage.key

    // Solo activar si la reacción es 🌟
    if (reaction !== '🌟') return

    // Obtener mensaje original al que reaccionaste
    const original = await conn.loadMessage(m.chat, reactedKey.id)
    if (!original) return

    const mime =
      original?.message?.imageMessage?.mimetype ||
      original?.message?.videoMessage?.mimetype ||
      original?.message?.stickerMessage?.mimetype ||
      ''

    if (!/webp|image|video/g.test(mime))
      return conn.reply(m.chat, '⚠️ Solo reacciona 🌟 a imágenes/videos/stickers.', m)

    // Descargar
    let buffer = await original.download()
    let type = mime.includes('video') ? 'video' : mime.includes('webp') ? 'sticker' : 'image'

    // Si es sticker → PNG
    if (type === 'sticker') {
      let result = await webp2png(buffer)
      buffer = Buffer.from(await (await fetch(result.url)).arrayBuffer())
      type = 'image'
    }

    // Guardar archivo
    const mediaFolder = './media'
    if (!fs.existsSync(mediaFolder)) fs.mkdirSync(mediaFolder)

    const filename = `${Date.now()}_${Math.floor(Math.random() * 9999)}.jpg`
    const filepath = path.join(mediaFolder, filename)

    fs.writeFileSync(filepath, buffer)

    // Registrar
    global.db.data.mediaList.push({
      id: global.db.data.mediaList.length + 1,
      filename,
      path: filepath,
      type,
      from: m.sender,
      groupId: m.chat,
      date: new Date().toLocaleString(),
      savedByStar: true
    })

    console.log('[🌟 MEDIA GUARDADA POR REACCIÓN]', filename)

    // Mandar al privado
    await conn.sendMessage(
      m.sender,
      { [type]: buffer, fileName: filename, caption: '🌟 Archivo recuperado y guardado.' },
      {}
    )

    return
  }

  // ================================================
  //   .VER / .R — Funcionan normal
  // ================================================

  if (!['ver', 'r'].includes(command)) return

  try {
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || q.mediaType || ''

    if (!/webp|image|video/g.test(mime))
      return conn.reply(m.chat, '⚠️ Responde a una *imagen, sticker o video*.', m)

    await m.react('📥')

    let buffer = await q.download()
    let type = null
    let sentMessage = null

    if (/webp/.test(mime)) {
      let result = await webp2png(buffer)
      buffer = Buffer.from(await (await fetch(result.url)).arrayBuffer())
      type = 'image'

      sentMessage = await conn.sendMessage(
        m.chat,
        { image: buffer, caption: '🖼️ Sticker convertido a imagen.' },
        { quoted: m }
      )
    } else {
      const ext = mime.split('/')[1]
      type = mime.includes('video') ? 'video' : 'image'

      sentMessage = await conn.sendMessage(
        m.chat,
        { [type]: buffer, caption: '📸 Archivo recuperado.' },
        { quoted: m }
      )
    }

    await conn.sendMessage(m.chat, {
      react: { text: '✅', key: sentMessage.key }
    })

  } catch (e) {
    console.error(e)
    await conn.reply(m.chat, '⚠️ Error al recuperar el archivo.', m)
    await m.react('✖️')
  }
}

handler.help = ['ver', 'r']
handler.tags = ['tools', 'owner']
handler.command = ['ver', 'r']

export default handler
