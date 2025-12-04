// plugins/_verserie.js
// 📺 .verserie <género>
// Ej: .verserie terror | accion | drama | comedia | romance | ciencia-ficcion

let handler = async (m, { conn, args }) => {
  if (!args[0]) {
    return conn.reply(m.chat,
`📺 *¿Qué tipo de serie querés ver?*
Ejemplos:
• .verserie terror
• .verserie accion
• .verserie comedia
• .verserie drama
• .verserie romance
• .verserie ciencia-ficcion`, m)
  }

  const genero = args.join(' ').toLowerCase()

  try {
    await conn.sendMessage(m.chat, { react: { text: '📺', key: m.key } })

    const url = `https://streaming-recommendation-api.vercel.app/api/serie?genre=${encodeURIComponent(genero)}`
    const res = await fetch(url)
    const raw = await res.text()

    // 🛡️ Protección si la API devuelve texto inválido
    let data
    try {
      data = JSON.parse(raw)
    } catch {
      console.log("Respuesta inválida:", raw)
      return conn.reply(m.chat, '❌ La API de series está caída temporalmente.', m)
    }

    if (!data.success || !data.recommendation) {
      return conn.reply(m.chat, `❌ No encontré series del género *${genero}*`, m)
    }

    const s = data.recommendation

    let texto = `
📺 *RECOMENDACIÓN DE SERIE — ${genero.toUpperCase()}*

🎞️ *Título:* ${s.name}
📅 *Estreno:* ${s.date}
⭐ *Puntaje:* ${s.vote}
🎭 *Géneros:* ${s.genres}

📖 *Sinopsis:*
${s.overview}

🖼️ *Poster:*
https://image.tmdb.org/t/p/original${s.urlImage}

🍿 *FelixCat_Bot te recomienda una buena serie*
`.trim()

    await conn.reply(m.chat, texto, m)

  } catch (e) {
    console.error('ERROR .verserie:', e)
    await conn.reply(m.chat, '❌ Error interno al buscar la serie.', m)
  }
}

handler.help = ['verserie']
handler.tags = ['entretenimiento']
handler.command = ['verserie']

export default handler 
