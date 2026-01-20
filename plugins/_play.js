import fetch from "node-fetch"
import yts from "yt-search"
import ytdl from "ytdl-core"

// ================= HANDLER =================
const handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text.trim())
      return conn.reply(m.chat, "🌱 Ingresá un nombre o link de YouTube.", m)

    await m.react("🕒")

    const match = text.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/
    )

    const query = match ? "https://youtu.be/" + match[1] : text
    const search = await yts(query)
    const video = match
      ? search.videos.find(v => v.videoId === match[1]) || search.videos[0]
      : search.videos[0]

    if (!video) throw "❌ No se encontraron resultados."

    const { title, thumbnail, timestamp, views, ago, url, author, seconds } = video

    if (seconds > 3600) throw "⚠ Duración máxima: 1 hora."

    const info = `🎧 *YouTube Audio*

> 🎵 *Título:* ${title}
> 👤 *Canal:* ${author.name}
> ⏱️ *Duración:* ${timestamp}
> 👁️ *Vistas:* ${formatViews(views)}

> Enviando audio...`

    const thumb = (await conn.getFile(thumbnail)).data
    await conn.sendMessage(
      m.chat,
      { image: thumb, caption: info },
      { quoted: m }
    )

    // ===== AUDIO =====
    if (["play", "mp3"].includes(command)) {
      const audio = await getAud(url)
      if (!audio?.url) throw "⚠ No se pudo procesar el audio."

      await conn.sendMessage(
        m.chat,
        {
          audio: { url: audio.url },
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`
        },
        { quoted: m }
      )

      await m.react("✔️")
    }

  } catch (e) {
    await m.react("✖️")
    return conn.reply(
      m.chat,
      typeof e === "string" ? e : "⚠ Error inesperado.",
      m
    )
  }
}

handler.command = handler.help = ["play", "mp3"]
handler.tags = ["download"]
handler.group = true

export default handler

// ================= AUDIO (YTDL) =================
async function getAud(url) {
  try {
    const info = await ytdl.getInfo(url)

    const format = ytdl.chooseFormat(info.formats, {
      quality: "highestaudio",
      filter: "audioonly"
    })

    if (!format?.url) return null

    return {
      url: format.url,
      api: "ytdl-core"
    }
  } catch {
    return null
  }
}

// ================= UTILS =================
function formatViews(views) {
  if (!views) return "No disponible"
  if (views >= 1e9) return (views / 1e9).toFixed(1) + "B"
  if (views >= 1e6) return (views / 1e6).toFixed(1) + "M"
  if (views >= 1e3) return (views / 1e3).toFixed(1) + "k"
  return views.toString()
}
