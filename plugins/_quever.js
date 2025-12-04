// plugins/_quever.js
// 🎬 .quever <género>
// Ej: .quever terror | accion | comedia | drama | romance | ciencia-ficcion

import fetch from 'node-fetch'

const handler = async (m, { conn, args }) => {
  if (!args[0]) {
    return conn.reply(m.chat, 
`🎬 *¿Qué género querés ver?*
Ejemplos:
• .quever terror
• .quever accion
• .quever comedia
• .quever drama
• .quever romance
• .quever ciencia-ficcion`, m)
  }

  const genero = args.join(' ').toLowerCase()

  try {
    await conn.sendMessage(m.chat, { react: { text: '🍿', key: m.key } })

    const url = `https://streaming-recommendation-api.vercel.app/api/movie?genre=${encodeURIComponent(genero)}`
    const res = await fetch(url)
    const data = await res.json()

    if (!Array.isArray(data) || data.length === 0) {
      return conn.reply(m.chat, `❌ No encontré películas del género *${genero}*`, m)
    }

    // 🎯 Tomar solo 10
    const pelis = data.slice(0, 10)

    let texto = `🎬 *TOP 10 para ver — ${genero.toUpperCase()}*\n\n`

    pelis.forEach((p, i) => {
      texto += `*${i + 1}.* ${p.title}\n🔗 ${p.link}\n\n`
    })

    texto += `🍿 *FelixCat_Bot te recomienda cine de calidad*`

    await conn.reply(m.chat, texto, m)

  } catch (e) {
    console.error('Error en .quever:', e)
    await conn.reply(m.chat, '❌ Error al buscar películas.', m)
  }
}

handler.help = ['quever']
handler.tags = ['entretenimiento']
handler.command = ['quever']
handler.group = false

export default handler 
