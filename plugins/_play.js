import yts from "yt-search"
import ytdl from "@distube/ytdl-core"

const handler = async (m, { conn, text, command }) => {
  try {
    if (!text) return conn.reply(m.chat, "🌱 Escribí un nombre o link de YouTube.", m)

    await m.react("🕒")

    const search = await yts(text)
    const video = search.videos?.[0]
    if (!video) throw "❌ No se encontraron resultados."

    if (video.seconds > 3600)
      throw "⚠ Máximo permitido: 1 hora."

    const info = `🎧 *YouTube Audio*
    
🎵 *Título:* ${video.title}
👤 *Canal:* ${video.author.name}
⏱️ *Duración:* ${video.timestamp}
👁️ *Vistas:* ${formatViews(video.views)}

📤 Enviando audio...`

    await conn.sendMessage(
      m.chat,
      { image: { url: video.thumbnail }, caption: info },
      { quoted: m }
    )

    // 🔊 AUDIO OPUS (PTT)
    const stream = ytdl(video.url, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 25
    })

    await conn.sendMessage(
      m.chat,
      {
        audio: stream,
        mimetype: "audio/ogg; codecs=opus",
        ptt: true
      },
      { quoted: m }
    )

    await m.react("✔️")

  } catch (e) {
    await m.react("✖️")
    return conn.reply(
      m.chat,
      typeof e === "string" ? e : "⚠ Error al procesar el audio.",
      m
    )
  }
}

handler.command = ["play", "mp3"]
handler.tags = ["download"]
handler.group = true
export default handler

function formatViews(v) {
  if (!v) return "N/D"
  if (v >= 1e9) return (v / 1e9).toFixed(1) + "B"
  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M"
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "k"
  return v.toString()
}
