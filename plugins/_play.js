import fs from "fs"
import path from "path"
import fetch from "node-fetch"
import yts from "yt-search"
import ytdl from "ytdl-core"
import { spawn } from "child_process"

const __dirname = process.cwd()

// ================= HANDLER =================
const handler = async (m, { conn, text, command }) => {
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

    const { title, thumbnail, timestamp, views, url, author, seconds } = video
    if (seconds > 3600) throw "⚠ Máximo 1 hora."

    const info = `🎧 *YouTube (Opus)*

> 🎵 *Título:* ${title}
> 👤 *Canal:* ${author.name}
> ⏱️ *Duración:* ${timestamp}
> 👁️ *Vistas:* ${formatViews(views)}

> Procesando audio...`

    const thumb = (await conn.getFile(thumbnail)).data
    await conn.sendMessage(
      m.chat,
      { image: thumb, caption: info },
      { quoted: m }
    )

    const filePath = await ytdlToOpus(url)
    if (!filePath) throw "⚠ No se pudo convertir el audio."

    await conn.sendMessage(
      m.chat,
      {
        audio: fs.readFileSync(filePath),
        mimetype: "audio/ogg; codecs=opus",
        ptt: true
      },
      { quoted: m }
    )

    fs.unlinkSync(filePath)
    await m.react("✔️")

  } catch (e) {
    await m.react("✖️")
    return conn.reply(m.chat, typeof e === "string" ? e : "⚠ Error.", m)
  }
}

handler.command = handler.help = ["play", "mp3"]
handler.tags = ["download"]
handler.group = true
export default handler

// ================= YTDL → OPUS =================
async function ytdlToOpus(url) {
  return new Promise(async (resolve) => {
    try {
      const temp = path.join(__dirname, `tmp_${Date.now()}.opus`)

      const ytdlStream = ytdl(url, {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1 << 25
      })

      const ffmpeg = spawn("ffmpeg", [
        "-y",
        "-i", "pipe:0",
        "-vn",
        "-c:a", "libopus",
        "-b:a", "64k",
        "-f", "opus",
        temp
      ])

      ytdlStream.pipe(ffmpeg.stdin)

      ffmpeg.on("close", (code) => {
        if (code === 0 && fs.existsSync(temp)) resolve(temp)
        else resolve(null)
      })

    } catch {
      resolve(null)
    }
  })
}

// ================= UTILS =================
function formatViews(views) {
  if (!views) return "No disponible"
  if (views >= 1e9) return (views / 1e9).toFixed(1) + "B"
  if (views >= 1e6) return (views / 1e6).toFixed(1) + "M"
  if (views >= 1e3) return (views / 1e3).toFixed(1) + "k"
  return views.toString()
}
