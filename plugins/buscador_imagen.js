// 📂 plugins/buscador_imagen.js — FelixCat-Bot
// Buscador de imágenes estable sin API Key

import fetch from 'node-fetch'
import cheerio from 'cheerio'

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

    // 🔹 Buscar imágenes en Google
    const query = encodeURIComponent(text)
    const res = await fetch(`https://www.google.com/search?tbm=isch&q=${query}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const html = await res.text()
    const $ = cheerio.load(html)
    const images = []
    $('img').each((i, el) => {
      const src = $(el).attr('src')
      if (src && !src.startsWith('data:')) images.push(src)
    })

    if (images.length === 0) {
      return await conn.sendMessage(
        m.chat,
        { text: '⚠️ No se encontraron imágenes para tu búsqueda.' },
        { quoted: m }
      )
    }

    // 🔹 Elegir una al azar
    const image = images[Math.floor(Math.random() * images.length)]

    // 🔹 Descargar imagen
    const response = await fetch(image)
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
