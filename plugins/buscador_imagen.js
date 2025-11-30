// 📂 plugins/buscador_imagen.js — FelixCat-Bot
// Buscador de imágenes usando Yandex (mucho más estable que Google)

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
    await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } })

    const query = encodeURIComponent(text)

    // 🔹 Buscar imágenes en Yandex
    const url = `https://yandex.com/images/search?text=${query}`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    })
    const html = await res.text()

    // Extraer URL reales de imágenes desde "img_url="
    const regex = /img_url=(.*?)&/g
    let images = []
    let match

    while ((match = regex.exec(html)) !== null) {
      let clean = decodeURIComponent(match[1])
      if (clean.startsWith('http')) images.push(clean)
    }

    if (!images.length) {
      return await conn.sendMessage(
        m.chat,
        { text: '⚠️ No se encontraron imágenes.' },
        { quoted: m }
      )
    }

    // Elegir una random
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
      { text: '⚠️ Error al buscar la imagen. Intenta con otro término.' },
      { quoted: m }
    )
  }
}

handler.help = ['imagen <texto>']
handler.tags = ['buscador']
handler.command = ['imagen']

export default handler
