
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
    const raw = await res.text()

    // 🛡️ Blindaje por si la API cae
    let data
    try {
      data = JSON.parse(raw)
    } catch {
      console.log("Respuesta inválida:", raw)
      return conn.reply(m.chat, '❌ La API de películas está caída.', m)
    }

    if (!data.success || !data.recommendation) {
      return conn.reply(m.chat, `❌ No encontré películas del género *${genero}*`, m)
    }

    const p = data.recommendation

    let texto = `
🎬 *RECOMENDACIÓN — ${genero.toUpperCase()}*

🎞️ *Título:* ${p.name}
📅 *Estreno:* ${p.date}
⭐ *Puntaje:* ${p.vote}
🎭 *Géneros:* ${p.genres}

📖 *Sinopsis:*
${p.overview}

🖼️ *Poster:*
https://image.tmdb.org/t/p/original${p.urlImage}

🍿 *FelixCat_Bot recomienda cine de verdad*
`.trim()

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
