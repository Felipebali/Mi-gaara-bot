import yts from "yt-search"
import { exec } from "child_process"
import fs from "fs"
import path from "path"
import { promisify } from "util"

const execAsync = promisify(exec)
const ytDlpPath = "python3 -m yt_dlp" // usa yt-dlp de Termux
const tempDir = "./tmp"

if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

// 🎵 Artistas / palabras prohibidas
const forbiddenWords = [
  "roa",
  "peke77",
  "callejero fino",
  "anuel",
  "l-gante",
  "lgante",
  "hades",
  "bad bunny",
  "badbunny"
]

let handler = async (m, { conn, text, args, command, isOwner }) => {
  if (!text) return conn.sendMessage(m.chat, { text: "🎧 Escribí el nombre del video o canción." }, { quoted: m })

  // Bloqueo de palabras prohibidas
  if (!isOwner) {
    const lower = text.toLowerCase()
    if (forbiddenWords.some(w => lower.includes(w))) {
      return conn.sendMessage(m.chat, { text: "🚫 *Ese artista o contenido no está permitido.*" }, { quoted: m })
    }
  }

  await m.react("⌛")

  try {
    const searchRes = await yts(args.join(" "))
    if (!searchRes || !searchRes.videos.length) return conn.sendMessage(m.chat, { text: "❌ No se encontró ningún resultado." }, { quoted: m })

    const video = searchRes.videos[0]
    const url = video.url
    const randomName = Math.random().toString(36).substring(2, 15)
    const isAudio = command === "play" || command === "audio"
    const ext = isAudio ? ".m4a" : ".mp4"
    const outPath = path.join(tempDir, randomName + ext)

    // Preview
    await conn.sendFile(
      m.chat,
      video.thumbnail,
      undefined,
      `╔══════════════════════╗
║ 🎶 YOUTUBE ${isAudio ? "AUDIO" : "VIDEO"}
╠══════════════════════╣
║ 📌 Título:
║ ${video.title}
║
║ ⏳ Estado: Descargando…
║ ⚡ Calidad: Óptima
║ 🔐 Proceso seguro
╚══════════════════════╝`,
      m
    )

    // Comando yt-dlp
    const format = isAudio ? "bestaudio[ext=m4a]" : "bestvideo+bestaudio/best"
    const cmd = `${ytDlpPath} -f "${format}" --no-playlist -o "${outPath}" "${url}"`

    await execAsync(cmd).catch(err => {
      console.error("YT-DLP ERROR:", err.stderr || err.message)
      throw new Error("❌ Falló la descarga")
    })

    if (!fs.existsSync(outPath)) throw new Error("❌ Archivo no generado")

    const buffer = await fs.promises.readFile(outPath)
    await conn.sendMessage(
      m.chat,
      isAudio
        ? { audio: buffer, mimetype: "audio/mp4" }
        : { video: buffer },
      { quoted: m }
    )

    await fs.promises.unlink(outPath)

  } catch (e) {
    console.error("PLUGIN ERROR:", e)
    conn.sendMessage(m.chat, { text: "⚠️ Error al descargar el video o audio." }, { quoted: m })
  }
}

handler.command = ["play", "audio", "video", "vídeo"]
export default handler
