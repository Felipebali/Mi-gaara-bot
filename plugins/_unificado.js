import fs from 'fs'
import path from 'path'
import { webp2png } from '../lib/webp2mp4.js'

const OWNER_FIXED = '59898719147@s.whatsapp.net'

let handler = async (m, { conn }) => {

  // ✅ Detectar si responde a una foto de ver una vez
  const q = m.quoted
  if (!q) return

  const isViewOnce =
    q.message?.viewOnceMessageV2 ||
    q.message?.viewOnceMessageV2Extension

  if (!isViewOnce) return

  const mime = q.mimetype || q.mediaType || ''
  if (!/webp|image|video/.test(mime)) return

  try {
    await m.react('😂')

    let buffer = await q.download()
    let type = mime.startsWith('video') ? 'video' : 'image'
    let filenameSent = `recuperado.${mime.split('/')[1] || 'jpg'}`

    if (/webp/.test(mime)) {
      let result = await webp2png(buffer)
      if (result?.url) {
        buffer = Buffer.from(await (await fetch(result.url)).arrayBuffer())
        type = 'image'
        filenameSent = 'sticker.png'
      }
    }

    // ✅ ENVIAR SOLO AL OWNER
    await conn.sendMessage(
      OWNER_FIXED,
      { [type]: buffer, fileName: filenameSent, caption: '📸 Recuperado por respuesta.' },
      { quoted: null }
    )

    // ✅ GUARDADO AUTOMÁTICO
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
      savedBy: 'respuesta viewOnce'
    })

  } catch (e) {
    console.error(e)
  }
}

handler.all = handler
export default handler
