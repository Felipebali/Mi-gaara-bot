// 📂 plugins/_ver.js — FelixCat-Bot 🐾
// ver/r → recupera en grupo
// rr → guarda y envía al privado, NO lo muestra en el grupo

import fs from 'fs'
import path from 'path'
import { webp2png } from '../lib/webp2mp4.js'

let handler = async (m, { conn, command }) => {

  // VALIDAR OWNER
  const owners = global.owner.map(o => o[0].replace(/[^0-9]/g, ''))
  const senderNumber = m.sender.replace(/[^0-9]/g, '')
  if (!owners.includes(senderNumber)) {
    await m.react('✖️')
    return conn.reply(m.chat, '❌ Solo los owners pueden usar este comando.', m)
  }

  try {
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || q.mediaType || ''

    if (!/webp|image|video/g.test(mime))
      return conn.reply(m.chat, '⚠️ Responde a una *imagen, sticker o video*.', m)

    await m.react('📥')

    let buffer = await q.download()
    let type = null
    let filenameSent = null
    let sentMessage = null

    // =======================================
    // 🖼️ STICKER → PNG
    // =======================================
    if (/webp/.test(mime)) {
      let result = await webp2png(buffer)

      if (result?.url) {
        type = 'image'
        buffer = Buffer.from(await (await fetch(result.url)).arrayBuffer())
        filenameSent = 'sticker.png'

        // SOLO SI NO ES ".rr" se muestra en el grupo
        if (command !== 'rr') {
          sentMessage = await conn.sendMessage(
            m.chat,
            { image: { url: result.url }, caption: '🖼️ Sticker convertido a imagen.' },
            { quoted: m }
          )
        }
      }
    }

    // =======================================
    // 📸 IMAGEN O VIDEO NORMAL
    // =======================================
    else {
      const ext = mime.split('/')[1]
      type = mime.includes('video') ? 'video' : 'image'
      filenameSent = 'recuperado.' + ext

      if (command !== 'rr') {
        sentMessage = await conn.sendMessage(
          m.chat,
          { [type]: buffer, fileName: filenameSent, caption: '📸 Archivo recuperado.' },
          { quoted: m }
        )
      }
    }

    // =======================================
    // REACCIONES
    // =======================================

    if (command === 'rr') {
      // RR → solo reacciona en el grupo al mensaje original
      await conn.sendMessage(m.chat, {
        react: { text: '🌟', key: m.key }
      })
    } else {
      // ver / r → reacción normal al archivo enviado
      await conn.sendMessage(m.chat, {
        react: { text: '✅', key: sentMessage.key }
      })
    }

    // =======================================
    // 📂 GUARDAR MEDIA
    // =======================================

    const mediaFolder = './media'
    if (!fs.existsSync(mediaFolder)) fs.mkdirSync(mediaFolder)

    global.db.data.mediaList = global.db.data.mediaList || []

    const filename = `${Date.now()}_${Math.floor(Math.random() * 9999)}`
    const ext = filenameSent.split('.').pop()
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

    console.log('[MEDIA GUARDADA]', finalName)

    // =======================================
    // 📤 SOLO ".rr" → ENVIAR AL PRIVADO
    // =======================================

    if (command === 'rr') {
      await conn.sendMessage(
        m.sender,
        { [type]: buffer, fileName: filenameSent, caption: '🌟 Archivo recuperado y guardado.' },
        { quoted: m }
      )
    }

  } catch (e) {
    console.error(e)
    await m.react('✖️')
    conn.reply(m.chat, '⚠️ Error al recuperar el archivo.', m)
  }
}

handler.help = ['ver', 'r', 'rr']
handler.tags = ['tools', 'owner']
handler.command = ['ver', 'r', 'rr']

export default handler
