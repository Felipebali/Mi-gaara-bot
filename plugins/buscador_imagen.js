// 📂 plugins/buscador_imagen.js — FelixCat-Bot
// Buscador de imágenes estable usando @bochilteam/scraper y fetch

import { googleImage } from '@bochilteam/scraper'
import fetch from 'node-fetch'

let handler = async (m, { conn, text }) => {
  if (!text) {
    return await conn.sendMessage(
      m.chat,
      { text: '⚠️ Ingresa algo para buscar. Ejemplo: *.imagen gatos*' },
      { quoted: m }
    )
  }

  try {
    // 🔹 Reacción inicial
    await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

    // 🔹 Buscar imágenes
    const results = await googleImage(text)
    if (!results || results.length === 0) {
      return await conn.sendMessage(
        m.chat,
        { text: '⚠️ No se encontraron imágenes para tu búsqueda.' },
        { quoted: m }
      )
    }

    // 🔹 Tomar una imagen aleatoria entre las primeras 20
    const images = results.slice(0, 20)
    const image = images[Math.floor(Math.random() * images.length)]

    // 🔹 Descargar la imagen como buffer
    const response = await fetch(image.url || image)
    const buffer = await response.arrayBuffer()

    // 🔹 Enviar imagen
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
