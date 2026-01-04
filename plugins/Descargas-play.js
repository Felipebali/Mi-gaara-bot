import yts from "yt-search"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import { existsSync, promises } from "fs"

const execAsync = promisify(exec)
const ytDlpPath = process.platform === "win32" ? "./node_modules/gs/ygs.exe" : "./node_modules/gs/ygs"
const cookiesPath = "./lib/cookies.txt"
const tempDir = "./tmp"

// Crear carpeta tmp si no existe
if (!existsSync(tempDir)) promises.mkdir(tempDir, { recursive: true })

// ══════════════════════════════════════════════════════
// 🕐 ANTI-SPAM (2 minutos)
const userCooldowns = {}

let handler = async (m, { conn, args, text, isOwner, sender }) => {
  try {
    // Cooldown
    if (!isOwner) {
      const now = Date.now()
      const cooldownTime = 2 * 60 * 1000
      const lastUse = userCooldowns[sender] || 0
      const timeLeft = lastUse + cooldownTime - now

      if (timeLeft > 0) {
        const seconds = Math.ceil(timeLeft / 1000)
        const minutes = Math.floor(seconds / 60)
        const secs = seconds % 60
        const timeStr = minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`
        return conn.sendMessage(m.chat, { text: `⏰ Espera ${timeStr} antes de usar *.play* de nuevo.` }, { quoted: m })
      }
      userCooldowns[sender] = now
    }

    // Query
    let query = (text || "").replace(/^\.play\s*/i, "").trim()
    if (!query && args?.length > 0) query = args.join(" ").trim()
    if (!query) return conn.sendMessage(m.chat, { text: "❗ Debes ingresar un artista y una canción.\nEjemplo: .play Canserbero - mundo de piedra" }, { quoted: m })

    await conn.sendMessage(m.chat, { react: { text: "⌛", key: m.key } })

    // Buscar video
    const searchRes = await yts.search({ query, hl: "es", gl: "ES" })
    if (!searchRes?.videos?.length) return conn.sendMessage(m.chat, { text: "❌ No se encontró ningún resultado." }, { quoted: m })

    const video = searchRes.videos[0]
    const url = video.url
    const randomFileName = Math.random().toString(36).substring(2, 15)
    const outputPath = path.join(tempDir, `${randomFileName}.m4a`)

    // Preview
    await conn.sendMessage(
      m.chat,
      {
        image: { url: video.thumbnail },
        caption: `🎧 *${video.title}*\n⏳ Descargando audio...`
      },
      { quoted: m }
    )

    // Descargar con yt-dlp
    const cookiesFlag = existsSync(cookiesPath) ? `--cookies "${cookiesPath}"` : ""
    const cmd = `${ytDlpPath} -f "bestaudio[ext=m4a]/bestaudio/best" ${cookiesFlag} --extractor-args "youtube:player_client=default" --no-warnings -o "${outputPath}" "${url}"`

    try { await execAsync(cmd) }
    catch (error) { console.error("❌ Error yt-dlp:", error.message) }

    // Verificar archivo
    const tmpFiles = await promises.readdir(tempDir)
    const foundFile = tmpFiles.find(f => f.startsWith(randomFileName))
    const finalPath = foundFile ? path.join(tempDir, foundFile) : outputPath

    if (!existsSync(finalPath)) return conn.sendMessage(m.chat, { text: "❌ Error: archivo no generado." }, { quoted: m })

    // Enviar audio
    const buffer = await promises.readFile(finalPath)
    await conn.sendMessage(m.chat, { audio: buffer, mimetype: "audio/mp4" }, { quoted: m })
    await promises.unlink(finalPath)
    await conn.sendMessage(m.chat, { react: { text: "✨", key: m.key } })

  } catch (error) {
    console.error("❌ Error en plugin .play:", error.message)
    await conn.sendMessage(m.chat, { text: "⚠️ Error al descargar el audio." }, { quoted: m })
  }
}

handler.command = ["play", "audio"]
export default handler
