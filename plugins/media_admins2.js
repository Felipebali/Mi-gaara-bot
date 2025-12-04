import fs from 'fs'
import path from 'path'

const handler = async (m, { conn, args, command }) => {
  try {
    const owners = (global.owner || [])
      .map(o => (Array.isArray(o) ? o[0] : o))
      .map(v => v.replace(/[^0-9]/g,'') + '@s.whatsapp.net')

    if (!owners.includes(m.sender)) return

    const list = global.db.data.mediaList || []

    // ✅ LISTAR
    if (command === 'mlist') {
      if (!list.length) return m.reply('No hay medios.')

      const text = list.slice(0,50).map(it =>
        `ID:${it.id} • ${it.filename} • ${it.type} • ${it.date}`
      ).join('\n')

      return m.reply(`📁 MEDIOS:\n\n${text}`)
    }

    // ✅ ENVIAR
    if (command === 'mget') {
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
    if (command === 'mdel') {
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
    if (command === 'mclear') {
      for (const it of list) {
        if (fs.existsSync(it.path)) fs.unlinkSync(it.path)
      }

      global.db.data.mediaList = []
      return m.reply('🗑 Media completamente limpiado.')
    }

  } catch (e) {
    console.error(e)
    m.reply('Error en media admin.')
  }
}

handler.command = ['mlist','mget','mdel','mclear']
handler.owner = true
export default handler
