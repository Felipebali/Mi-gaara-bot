import fetch from 'node-fetch'
import yts from 'yt-search'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text)
    return conn.reply(
      m.chat,
      `❌ Usá así:\n\n${usedPrefix + command} Billie Eilish`,
      m
    )

  await conn.reply(m.chat, '🔎 Buscando en YouTube...', m)

  const search = await yts(text)
  const video = search.videos[0]

  if (!video)
    return conn.reply(m.chat, '❌ No encontré resultados.', m)

  let info = `🎵 *YOUTUBE PLAY*\n
📌 *Título:* ${video.title}
⏱️ *Duración:* ${video.timestamp}
👁️ *Vistas:* ${video.views.toLocaleString()}
🔗 ${video.url}
`

  await conn.reply(m.chat, info, m)

  try {
    // 🔥 API estable
    const api = `https://api.agungny.my.id/api/youtube-audio?url=${video.url}`

    const res = await fetch(api)
    const json = await res.json()

    if (!json.status)
      throw 'Error en la API'

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: json.result.url },
        mimetype: 'audio/mpeg',
        fileName: `${video.title}.mp3`
      },
      { quoted: m }
    )

  } catch (e) {
    console.error(e)
    conn.reply(m.chat, '❌ Error al descargar el audio.', m)
  }
}

handler.command = ['play']
export default handler
