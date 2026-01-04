import yts from "yt-search"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execAsync = promisify(exec)
const tempDir = "./tmp"
const ytDlpPath = "./yt-dlp"
const cookiesPath = "./cookies.txt"

// Crear carpeta tmp si no existe
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

// Palabras/artistas prohibidos
const forbiddenWords = ["roa","peke77","callejero fino","anuel","l-gante","lgante","hades","bad bunny","badbunny"]

// Usuarios en cooldown
const userCooldowns = {}

let handler = async (m, { conn, text, args, command, isOwner }) => {
  if (!text && !args?.length) return conn.sendMessage(m.chat, { text: "🎧 Escribí el nombre del video o canción." }, { quoted: m })

  // Cooldown para usuarios (2 min)
  if (!isOwner) {
    const now = Date.now()
    const last = userCooldowns[m.sender] || 0
    if (now - last < 120000) {
      const wait = Math.ceil((120000 - (now - last)) / 1000)
      return conn.sendMessage(m.chat, { text: `⏰ Esperá ${wait} segundos antes de usar el comando nuevamente.` }, { quoted: m })
    }
    userCooldowns[m.sender] = now
  }

  const query = (text || args.join(" ")).trim()
  const lower = query.toLowerCase()

  // Filtrar palabras prohibidas
  if (!isOwner && forbiddenWords.some(w => lower.includes(w))) {
    return conn.sendMessage(m.chat, { text: "🚫 Ese artista o contenido no está permitido." }, { quoted: m })
  }

  await m.react("⌛")

  try {
    const searchRes = await yts(query)
    if (!searchRes || !searchRes.videos.length) return conn.sendMessage(m.chat, { text: "❌ No se encontró resultado." }, { quoted: m })

    const video = searchRes.videos[0]
    const url = video.url
    const isAudio = command === "play" || command === "audio"
    const ext = isAudio ? ".m4a" : ".mp4"
    const output = path.join(tempDir, Math.random().toString(36).substring(2, 15) + ext)
    const format = isAudio ? "bestaudio[ext=m4a]" : "bestvideo+bestaudio/best"
    const messageType = isAudio ? "audio" : "video"
    const mimeType = isAudio ? "audio/mp4" : undefined

    // Enviar preview
    await conn.sendMessage(
      m.chat,
      { image: { url: video.thumbnail }, caption: `🎶 ${isAudio ? "AUDIO" : "VIDEO"}\n📌 ${video.title}\n⏳ Descargando…` },
      { quoted: m }
    )

    // Descargar con yt-dlp
    const cookiesFlag = fs.existsSync(cookiesPath) ? `--cookies "${cookiesPath}"` : ""
    const cmd = `${ytDlpPath} -f "${format}" ${cookiesFlag} -o "${output}" "${url}" --no-warnings --no-playlist`

    await execAsync(cmd)

    if (!fs.existsSync(output)) throw new Error("❌ Archivo no generado")

    const buffer = await fs.promises.readFile(output)
    await conn.sendMessage(m.chat, isAudio ? { audio: buffer, mimetype } : { video: buffer }, { quoted: m })
    await fs.promises.unlink(output)
    await m.react("✨")
  } catch (e) {
    console.error("❌ Error en plugin play:", e)
    await conn.sendMessage(m.chat, { text: "⚠️ Error al descargar el video o audio." }, { quoted: m })
  }
}

handler.command = ["play","audio","video","vídeo"]
export default handler
