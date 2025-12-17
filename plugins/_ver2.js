// 📂 plugins/_ver.js — FelixCat-Bot 🐾
// ver / r → recupera en grupo + copia al owner
// rr → privado del owner (sin mostrar en grupo)
// mlist → lista resumida sin spam
// mlist <id> → detalle
// mget <id> → recuperar media
// mclear → limpiar historial y archivos

import fs from 'fs'
import path from 'path'
import { webp2png } from '../lib/webp2mp4.js'

const OWNER_JID = '59898719147@s.whatsapp.net'

let handler = async (m, { conn, command, text }) => {

  // ================= VALIDAR OWNER =================
  const owners = global.owner.map(o => o[0].replace(/[^0-9]/g, ''))
  const senderNumber = m.sender.replace(/[^0-9]/g, '')
  if (!owners.includes(senderNumber)) {
    await m.react('✖️')
    return conn.reply(m.chat, '❌ Solo los owners pueden usar este comando.', m)
  }

  // ================= BASE DE DATOS =================
  global.db.data.recoveredMedia = global.db.data.recoveredMedia || []

  // =================================================
  // 📜 LISTAR MULTIMEDIA (SIN SPAM)
  // =================================================
  if (command === 'mlist') {
    if (!global.db.data.recoveredMedia.length)
      return conn.reply(m.chat, '📂 No hay multimedia recuperada.', m)

    // ─── DETALLE POR ID ───
    if (text) {
      const id = parseInt(text)
      if (!id) return conn.reply(m.chat, '⚠️ Usa: `.mlist` o `.mlist <id>`', m)

      const d = global.db.data.recoveredMedia.find(x => x.id === id)
      if (!d) return conn.reply(m.chat, '❌ ID no encontrado.', m)

      return conn.reply(
        m.chat,
`📄 *DETALLE DE MULTIMEDIA*
━━━━━━━━━━━━━━━━━━━━
🆔 ID: ${d.id}
🎞️ Tipo: ${d.type}
🏷️ Grupo: ${d.groupName || 'Privado'}
📅 Fecha: ${d.date}
📁 Archivo: ${d.filename}
━━━━━━━━━━━━━━━━━━━━
Usa *.mget ${d.id}* para recuperarlo`,
        m
      )
    }

    // ─── LISTA RESUMIDA ───
    let txt =
`📂 *MULTIMEDIA RECUPERADA (${global.db.data.recoveredMedia.length})*
━━━━━━━━━━━━━━━━━━━━\n`

    global.db.data.recoveredMedia.slice(-15).forEach(d => {
      const icon = d.type === 'video' ? '🎞️' : '🖼️'
      const fecha = d.date.split(',')[0]
      txt += `🆔 ${d.id} | ${icon} ${d.type} | ${fecha}\n`
    })

    txt +=
`\n━━━━━━━━━━━━━━━━━━━━
Usa *.mget <id>* para recuperar
Usa *.mlist <id>* para ver detalles`

    return conn.reply(m.chat, txt, m)
  }

  // =================================================
  // 📥 RECUPERAR DESDE LISTA
  // =================================================
  if (command === 'mget') {
    const id = parseInt(text)
    if (!id) return conn.reply(m.chat, '⚠️ Usa: `.mget <id>`', m)

    const data = global.db.data.recoveredMedia.find(x => x.id === id)
    if (!data || !fs.existsSync(data.path))
      return conn.reply(m.chat, '❌ Archivo no encontrado.', m)

    const buffer = fs.readFileSync(data.path)

    await conn.sendMessage(
      m.sender,
      {
        [data.type]: buffer,
        fileName: data.filename,
        caption: `📥 Recuperado desde historial\n🆔 ID: ${id}`
      }
    )
    return
  }

  // =================================================
  // 🧹 LIMPIAR HISTORIAL
  // =================================================
  if (command === 'mclear') {
    if (!global.db.data.recoveredMedia.length)
      return conn.reply(m.chat, '📂 La lista ya está vacía.', m)

    let deleted = 0

    for (const d of global.db.data.recoveredMedia) {
      if (d.path && fs.existsSync(d.path)) {
        try {
          fs.unlinkSync(d.path)
          deleted++
        } catch {}
      }
    }

    global.db.data.recoveredMedia = []
    if (global.db.write) await global.db.write()

    return conn.reply(
      m.chat,
`🧹 *MLIST LIMPIADA*
━━━━━━━━━━━━━━━━━━━━
🗑️ Archivos eliminados: ${deleted}
📂 Historial reiniciado.`,
      m
    )
  }

  // =================================================
  // 📥 RECUPERACIÓN NORMAL
  // =================================================
  try {
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || q.mediaType || ''

    if (!/webp|image|video/g.test(mime))
      return conn.reply(m.chat, '⚠️ Responde a una imagen, sticker o video.', m)

    await m.react('📥')

    let buffer = await q.download()
    let type, filenameSent, sentMessage

    // ---------- STICKER ----------
    if (/webp/.test(mime)) {
      const result = await webp2png(buffer)
      if (!result?.url) throw 'webp error'

      type = 'image'
      buffer = Buffer.from(await (await fetch(result.url)).arrayBuffer())
      filenameSent = 'sticker.png'

      if (command !== 'rr') {
        sentMessage = await conn.sendMessage(
          m.chat,
          { image: buffer, caption: '🖼️ Sticker convertido.' },
          { quoted: m }
        )
      }
    }

    // ---------- IMG / VIDEO ----------
    else {
      const ext = mime.split('/')[1]
      type = mime.includes('video') ? 'video' : 'image'
      filenameSent = `recuperado.${ext}`

      if (command !== 'rr') {
        sentMessage = await conn.sendMessage(
          m.chat,
          { [type]: buffer, caption: '📸 Archivo recuperado.' },
          { quoted: m }
        )
      }
    }

    // ---------- REACCIONES ----------
    if (command === 'rr') {
      await conn.sendMessage(m.chat, { react: { text: '🌟', key: m.key } })
    } else if (sentMessage) {
      await conn.sendMessage(m.chat, { react: { text: '✅', key: sentMessage.key } })
    }

    // =================================================
    // 📂 GUARDAR EN HISTORIAL
    // =================================================
    const mediaFolder = './media'
    if (!fs.existsSync(mediaFolder)) fs.mkdirSync(mediaFolder)

    const name = `${Date.now()}_${Math.floor(Math.random() * 9999)}`
    const ext = filenameSent.split('.').pop()
    const finalName = `${name}.${ext}`
    const filepath = path.join(mediaFolder, finalName)

    fs.writeFileSync(filepath, buffer)

    let chatInfo = null
    if (m.isGroup) {
      try { chatInfo = await conn.groupMetadata(m.chat) } catch {}
    }

    const record = {
      id: global.db.data.recoveredMedia.length + 1,
      filename: finalName,
      path: filepath,
      type,
      from: m.sender,
      groupName: m.isGroup ? (chatInfo?.subject || '') : null,
      date: new Date().toLocaleString()
    }

    global.db.data.recoveredMedia.push(record)
    if (global.db.write) await global.db.write()

    // =================================================
    // 📤 COPIA AL OWNER
    // =================================================
    if (command !== 'rr') {
      await conn.sendMessage(
        OWNER_JID,
        {
          [type]: buffer,
          fileName: filenameSent,
          caption:
`📥 MEDIA RECUPERADA
🆔 ID: ${record.id}
👤 ${senderNumber}
🏷️ ${record.groupName || 'Privado'}
📅 ${record.date}`
        }
      )
    }

    // ---------- RR PRIVADO ----------
    if (command === 'rr') {
      await conn.sendMessage(
        m.sender,
        { [type]: buffer, fileName: filenameSent, caption: '🌟 Archivo recuperado.' }
      )
    }

  } catch (e) {
    console.error(e)
    await m.react('✖️')
    conn.reply(m.chat, '⚠️ Error al recuperar el archivo.', m)
  }
}

handler.help = ['ver', 'r', 'rr', 'mlist', 'mget', 'mclear']
handler.tags = ['tools', 'owner']
handler.command = ['ver', 'r', 'rr', 'mlist', 'mget', 'mclear']

export default handler
