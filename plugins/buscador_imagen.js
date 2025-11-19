// plugins/buscador_imagen.js
import { googleImage } from '@bochilteam/scraper'

let handler = async (m, { conn, text }) => {
  if (!text) {
    await conn.sendMessage(m.chat, { text: '⚠️ Ingresa algo para buscar. Ejemplo: *.imagen gatos*' }, { quoted: m })
    return
  }

  try {
    // 🔹 Reacción de inicio
    await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

    const res = await googleImage(text)
    const results = res.slice(0, 20)
    const image = results[Math.floor(Math.random() * results.length)]

    if (!image || !image.url) throw 'No se encontró imagen válida.'

    // 🔹 Reacción de búsqueda exitosa
    await conn.sendMessage(m.chat, { react: { text: '🔍', key: m.key } })

    // 🔹 Enviar imagen correctamente
    await conn.sendMessage(
      m.chat,
      {
        image: { url: image.url },
        caption: `🔎 Resultado de: *${text}*`
      },
      { quoted: m }
    )

    // 🔹 Reacción final OK
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (e) {
    console.error(e)
    // 🔹 Reacción de error
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    await conn.sendMessage(
      m.chat,
      { text: '⚠️ No se pudo obtener la imagen. Intenta con otro término.' },
      { quoted: m }
    )
  }
}

handler.help = ['imagen <texto>']
handler.tags = ['buscador']
handler.command = ['imagen']

export default handler
