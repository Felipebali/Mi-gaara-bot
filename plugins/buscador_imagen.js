// 📂 plugins/buscador_imagen.js — FelixCat-Bot
// Buscador de imágenes HD sin API Key (versión ultra estable)

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
    const query = encodeURIComponent(text)

    // Obtener HTML de Google
    const res = await fetch(`https://www.google.com/search?tbm=isch&q=${query}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const html = await res.text()

    let images = []

    // 1️⃣ Método HD (JSON interno "ou")
    let match
    const regex = /"ou":"(.*?)"/g
    while ((match = regex.exec(html)) !== null) {
      images.push(match[1])
    }

    // 2️⃣ Fallback: capturar miniaturas válidas
    if (images.length === 0) {
      const regexThumb = /"tu":"(.*?)"/g
      while ((match = regexThumb.exec(html)) !== null) {
        images.push(match[1])
      }
    }

    // 3️⃣ Último método: scrapear <img>
    if (images.length === 0) {
      const $ = cheerio.load(html)
      $('img').each((i, el) => {
        const src = $(el).attr('src')
        if (src && src.startsWith('http') && !src.includes('gstatic')) {
          images.push(src)
        }
      })
    }

    // ❌ Si aún no hay nada
    if (images.length === 0) {
      return await conn.sendMessage(
        m.chat,
        { text: '⚠️ No se encontraron imágenes en la búsqueda. Intenta con otro término.' },
        { quoted: m }
      )
    }

    // Elegir una imagen random
    const image = images[Math.floor(Math.random() * images.length)]

    // Descargar imagen
    const response = await fetch(image)
    const buffer = await response.arrayBuffer()

    await conn.sendMessage(m.chat, { react: { text: '🔍', key: m.key } })

    await conn.sendMessage(
      m.chat,
      {
        image: Buffer.from(buffer),
        caption: `🔎 Resultado de: *${text}*`
      },
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
