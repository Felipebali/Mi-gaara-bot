// 📂 plugins/buscador_imagen.js — FelixCat-Bot
// Buscador de imágenes HD sin API Key

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

    // 🔹 Obtener HTML de Google Images
    const res = await fetch(`https://www.google.com/search?tbm=isch&q=${query}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const html = await res.text()

    // 🔹 Extraer URLs HD desde el JSON interno ("ou")
    const imagesHD = []
    let match
    const regex = /"ou":"(.*?)"/g

    while ((match = regex.exec(html)) !== null) {
      imagesHD.push(match[1])
    }

    // 🔹 Filtrar imágenes reales y de buena calidad
    const cleanImages = imagesHD.filter(url =>
      url.startsWith('https://') &&
      !url.includes('gstatic.com') &&
      !url.includes('.svg')
    )

    if (!cleanImages.length) {
      return await conn.sendMessage(
        m.chat,
        { text: '⚠️ No se encontraron imágenes en buena calidad.' },
        { quoted: m }
      )
    }

    // 🔹 Elegir una imagen HD al azar
    const image = cleanImages[Math.floor(Math.random() * cleanImages.length)]

    // 🔹 Descargar la imagen
    const response = await fetch(image)
    const buffer = await response.arrayBuffer()

    await conn.sendMessage(m.chat, { react: { text: '🔍', key: m.key } })

    await conn.sendMessage(
      m.chat,
      {
        image: Buffer.from(buffer),
        caption: `🔎 Resultado HD de: *${text}*`
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
