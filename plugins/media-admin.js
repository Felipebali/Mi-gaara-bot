// plugins/media-admin.js
import fs from 'fs'
import path from 'path'

const handler = async (m, { conn, args }) => {
  try {
    // Seguridad solo owner
    const owners = (global.owner || [])
      .map(o => (Array.isArray(o) ? o[0] : o))
      .map(v => v.replace(/[^0-9]/g,'') + '@s.whatsapp.net')

    if (!owners.includes(m.sender)) return

    if (!global.db || !global.db.data) 
      return m.reply('No hay base de datos cargada.')

    const list = global.db.data.mediaList || []
    const cmd = (args[0] || '').toLowerCase()

    // ================================
    // 📋 LISTAR
    // ================================
    if (!cmd || cmd === 'list' || cmd === 'medias') {
      if (!list.length) return conn.reply(m.chat, 'No hay medios guardados aún.', m)

      const lines = list.slice(0,50).map(it =>
        `ID:${it.id} • ${it.filename} • ${it.type} • from:${it.from} • group:${it.groupName || it.groupId} • ${it.date}`
      )

      const text = `📁 Medios guardados (mostrando ${Math.min(list.length,50)}/${list.length})\n\n` + lines.join('\n')
      return conn.reply(m.chat, text, m)
    }

    // ================================
    // 🗑 BORRAR TODOS
    // ================================
    if (cmd === 'clear' || cmd === 'clean' || cmd === 'wipe') {
      let count = 0

      for (const item of list) {
        const filepath = item.path || path.join('./media', item.filename)
        if (fs.existsSync(filepath)) {
          try { fs.unlinkSync(filepath); count++ } catch {}
        }
      }

      global.db.data.mediaList = []

      return conn.reply(m.chat, `🗑️ Se borraron *${count} archivos* y se limpió la base de datos.`, m)
    }

    // ================================
    // 🗑 BORRAR UNO O VARIOS <id>
    // ================================
    if (cmd === 'del' || cmd === 'delete' || cmd === 'rm') {
      const ids = args.slice(1).map(v => parseInt(v)).filter(v => !isNaN(v))

      if (!ids.length)
        return conn.reply(m.chat, 'Debes indicar IDs a borrar.\nEj: media del 5\nEj: media del 3 7 9', m)

      let deleted = 0

      for (let id of ids) {
        const index = list.findIndex(x => x.id === id)
        if (index === -1) continue

        const item = list[index]
        const filepath = item.path || path.join('./media', item.filename)

        if (fs.existsSync(filepath)) {
          try { fs.unlinkSync(filepath) } catch {}
        }

        list.splice(index, 1)
        deleted++
      }

      return conn.reply(m.chat, `🗑️ Se eliminaron *${deleted} archivos* correctamente.`, m)
    }

    // ================================
    // 📤 ENVIAR ARCHIVO POR ID
    // ================================
    if (!isNaN(cmd)) {
      const id = parseInt(cmd)
      const item = list.find(x => x.id === id)

      if (!item) return conn.reply(m.chat, `No existe medio con id ${id}`, m)

      const filepath = item.path || path.join('./media', item.filename)
      if (!fs.existsSync(filepath)) return conn.reply(m.chat, 'Archivo no encontrado en servidor.', m)

      const caption = `Archivo: ${item.filename}\nID: ${item.id}\nFrom: ${item.from}\nGroup: ${item.groupName || item.groupId}\nDate: ${item.date}`
      const buffer = fs.readFileSync(filepath)

      if (item.type === 'image') {
        await conn.sendMessage(m.sender, { image: buffer, caption }, { quoted: m })
      } else if (item.type === 'video') {
        await conn.sendMessage(m.sender, { video: buffer, caption, fileName: item.filename }, { quoted: m })
      } else if (item.type === 'audio') {
        await conn.sendMessage(m.sender, { audio: buffer, ptt: false, fileName: item.filename }, { quoted: m })
      } else {
        await conn.sendMessage(m.sender, { document: buffer, fileName: item.filename, mimetype: 'application/octet-stream', caption }, { quoted: m })
      }
      return
    }

    // Ayuda
    conn.reply(m.chat,
`Uso:
- medias → lista archivos
- media <id> → envía el archivo al privado
- media del <id> → BORRA el archivo
- media del 3 7 9 → borra varios
- media clear → borra TODO`,
    m)

  } catch (e) {
    console.error(e)
    m.reply('Error ejecutando comando.')
  }
}

handler.help = ['medias','media']
handler.tags = ['owner']
handler.command = [/^medias?$/i, /^media$/i]
handler.owner = true

export default handler
