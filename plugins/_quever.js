// plugins/_quever.js
// 🎬 .quever <género>
// Ej: .quever terror | accion | comedia | drama | romance | ciencia-ficcion

let handler = async (m, { conn, args }) => {
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

    const raw = await res.text() // ⬅️ NO JSON todavía

    // ❌ Si la API devuelve HTML (deploy error)
    if (!raw.startsWith('[')) {
      console.log('API devolvió este texto:', raw)
      return conn.reply(m.chat, '❌ La API de películas está caída en este momento.', m)
    }

    const data = JSON.parse(raw)

    if (!Array.isArray(data) || data.length === 0) {
      return conn.reply(m.chat, `❌ No encontré películas del género *${genero}*`, m)
    }

    const pelis = data.slice(0, 10)

    let texto = `🎬 *TOP 10 — ${genero.toUpperCase()}*\n\n`

    pelis.forEach((p, i) => {
      texto += `*${i + 1}.* ${p.title}\n`
      texto += `🔗 ${p.link}\n\n`
    })

    texto += `🍿 *FelixCat_Bot recomienda cine real*`

    await conn.reply(m.chat, texto, m)

  } catch (e) {
    console.error('ERROR .quever:', e)
    await conn.reply(m.chat, '❌ Error interno al buscar películas.', m)
  }
}

handler.help = ['quever']
handler.tags = ['entretenimiento']
handler.command = ['quever']

export default handler
