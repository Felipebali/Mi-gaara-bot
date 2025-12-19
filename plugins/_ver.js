// ver / r → recupera en el grupo
// m → guarda y envía SOLO al privado, sin mostrar nada en el grupo (SIN PREFIJO)

import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import { webp2png } from '../lib/webp2mp4.js'

let handler = async (m, { conn, command }) => {

  const isM = m.text?.toLowerCase() === 'm'

  // Solo ver / r o "m"
  if (!['ver', 'r'].includes(command) && !isM) return

  // ===== VALIDAR OWNER (silencio total si no lo es) =====
  const owners = global.owner.map(o => o[0].replace(/[^0-9]/g, ''))
  const senderNumber = m.sender.replace(/[^0-9]/g, '')
  if (!owners.includes(senderNumber)) return

  try {
    const q = m.quoted
    if (!q) {
      if (!isM) await m.reply('⚠️ Respondé a una imagen, video o sticker.')
      return
    }

    const mime = q.mimetype || q.mediaType || ''
    if (!/webp|image|video/.test(mime)) {
      if (!isM) await m.reply('⚠️ El mensaje citado no contiene multimedia.')
      return
    }

    if (!isM) await m.react('📥')

    let buffer = await q.download()
    let type = null
    let filenameSent = null
    let sentMessage = null

    // ============================
    // STICKER → PNG
    // ============================
    if (/webp/.test(mime)) {
      const result = await webp2png(buffer)

      if (result?.url) {
        type = 'image'
        buffer = Buffer.from(await (await fetch(result.url)).arrayBuffer())
        filenameSent = 'sticker.png'

        if (!isM) {
          sentMessage = await conn.sendMessage(
            m.chat,
            { image: { url: result.url }, caption: '🖼️ Sticker convertido.' },
            { quoted: null }
          )
        }
      }
    }

    // ============================
    // IMAGEN / VIDEO
    // ============================
    else {
      type = mime.startsWith('video') ? 'video' : 'image'
      const ext = mime.split('/')[1] || (type === 'video' ? 'mp4' : 'jpg')
      filenameSent = `recuperado.${ext}`

      if (!isM) {
        sentMessage = await conn.sendMessage(
          m.chat,
          { [type]: buffer, fileName: filenameSent, caption: '📸 Archivo recuperado.' },
          { quoted: null }
        )
      }
    }

    // ============================
    // REACCIÓN SOLO ver / r
    // ============================
    if (!isM && sentMessage?.key) {
      await conn.sendMessage(m.chat, {
        react: { text: '✅', key: sentMessage.key }
      })
    }

    // ============================
    // GUARDAR EN /media
    // ============================
    const mediaFolder = './media'
    fs.mkdirSync(mediaFolder, { recursive: true })

    global.db.data.mediaList ||= []

    const baseName = `${Date.now()}_${Math.floor(Math.random() * 9999)}`
    const extFile = filenameSent?.split('.').pop() || 'bin'
    const finalName = `${baseName}.${extFile}`
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
      savedBy: isM ? 'm' : command
    })

    // ============================
    // 📤 MODO m → SOLO PRIVADO
    // ============================
    if (isM) {
      await conn.sendMessage(
        m.sender,
        { [type]: buffer, fileName: filenameSent, caption: '🌟 Archivo recuperado.' },
        { quoted: null }
      )
    }

  } catch (e) {
    console.error(e)
    if (!isM) {
      await m.react('✖️')
      await m.reply('⚠️ Error al recuperar el archivo.')
    }
  }
}

// comandos normales
handler.help = ['ver', 'r']
handler.tags = ['tools', 'owner']
handler.command = ['ver', 'r']

// 🔥 "m" SIN PREFIJO
handler.customPrefix = /^m$/i
handler.command = new RegExp()

export default handler
