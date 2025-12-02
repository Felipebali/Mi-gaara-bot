// 📂 plugins/_ver.js — FelixCat-Bot 🐾
// Recupera fotos/videos/stickers Y LOS GUARDA como media normal

import fs from 'fs'
import path from 'path'
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
    let buffer = await q.download()
    let type = null
    let filenameSent = null
    let sentMessage = null

    // =============================
    //   🖼️ STICKER → PNG
    // =============================
    if (/webp/.test(mime)) {
      let result = await webp2png(buffer)

      if (result?.url) {
        type = 'image'

        sentMessage = await conn.sendMessage(
          m.chat,
          { image: { url: result.url }, caption: '🖼️ Sticker convertido a imagen.' },
          { quoted: m }
        )

        // Bajamos el PNG para guardarlo
        buffer = await (await fetch(result.url)).arrayBuffer()
        buffer = Buffer.from(buffer)
        filenameSent = 'sticker.png'
      }
    }

    // =============================
    //   📸 IMAGEN / VIDEO NORMAL
    // =============================
    else {
      const ext = mime.split('/')[1]
      type = mime.includes('video') ? 'video' : 'image'
      filenameSent = 'recuperado.' + ext

      sentMessage = await conn.sendMessage(
        m.chat,
        { [type]: buffer, fileName: filenameSent, caption: '📸 Archivo recuperado.' },
        { quoted: m }
      )
    }

    // =============================
    //   REACCIÓN AL ARCHIVO
    // =============================
    await conn.sendMessage(m.chat, {
      react: { text: '✅', key: sentMessage.key }
    })

    // =============================
    //   📁 GUARDAR AUTOMÁTICAMENTE
    // =============================
    const mediaFolder = './media'
    if (!fs.existsSync(mediaFolder)) fs.mkdirSync(mediaFolder)

    global.db.data.mediaList = global.db.data.mediaList || []

    const filename = `${Date.now()}_${Math.floor(Math.random() * 9999)}`
    const ext = filenameSent ? filenameSent.split('.').pop() : 'png'
    const finalName = `${filename}.${ext}`
    const filepath = path.join(mediaFolder, finalName)

    fs.writeFileSync(filepath, buffer)

    let chatInfo = null
    if (m.isGroup) {
      try { chatInfo = await conn.groupMetadata(m.chat) } catch {}
    }

    global.db.data.mediaList.push({
      id: global.db.data.mediaList.length + 1,
      filename: finalName,
      path: filepath,
      type,
      from: m.sender,
      groupId: m.isGroup ? m.chat : null,
      groupName: m.isGroup ? (chatInfo?.subject || '') : null,
      date: new Date().toLocaleString(),
      savedByVer: true
    })

    console.log('[MEDIA GUARDADA DESDE /ver]', finalName)

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
