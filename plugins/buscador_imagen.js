// 📂 plugins/buscador_imagen.js — FelixCat-Bot
// Buscador de imágenes estable usando image-search-google

import ImageSearch from 'image-search-google'
import fetch from 'node-fetch'

// 🔒 Configura tu API Key y Custom Search Engine ID
const GOOGLE_API_KEY = 'TU_API_KEY'
const GOOGLE_CSE_ID = 'TU_CSE_ID'

const client = new ImageSearch(GOOGLE_API_KEY, GOOGLE_CSE_ID)

let handler = async (m, { conn, text }) => {
  if (!text) {
    return await conn.sendMessage(
      m.chat,
      { text: '⚠️ Ingresa algo para buscar. Ejemplo: *.imagen gatos*' },
      { quoted: m }
    )
  }

  try {
    await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

    const results = await client.search(text, { num: 10 })
    if (!results || results.length === 0)
      return await conn.sendMessage(
        m.chat,
        { text: '⚠️ No se encontraron imágenes para tu búsqueda.' },
        { quoted: m }
      )

    // Elegir una al azar
    const image = results[Math.floor(Math.random() * results.length)]

    // Descargar imagen
    const response = await fetch(image.url)
    const buffer = await response.arrayBuffer()

    await conn.sendMessage(m.chat, { react: { text: '🔍', key: m.key } })
    await conn.sendMessage(
      m.chat,
      { image: Buffer.from(buffer), caption: `🔎 Resultado de: *${text}*` },
      { quoted: m }
    )
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })

  } catch (err) {
    console.error(err)
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
    await conn.sendMessage(
      m.chat,
      { text: '⚠️ Ocurrió un error al buscar la imagen. Intenta con otro término.' },
      { quoted: m }
    )
  }
}

handler.help = ['imagen <texto>']
handler.tags = ['buscador']
handler.command = ['imagen']

export default handler
