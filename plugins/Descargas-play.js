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
    // ══════════════════════════════════════════════════════
    // 🚫 VERIFICAR COOLDOWN (Solo usuarios, owner sin límite)
    if (!isOwner) {
      const now = Date.now()
      const cooldownTime = 2 * 60 * 1000 // 2 minutos
      const lastUse = userCooldowns[sender] || 0
      const timeLeft = lastUse + cooldownTime - now

      if (timeLeft > 0) {
        const seconds = Math.ceil(timeLeft / 1000)
        const minutes = Math.floor(seconds / 60)
        const secs = seconds % 60
        const timeStr = minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`
        return conn.sendText(m.chat, `⏰ Espera ${timeStr} antes de usar *.play* de nuevo.`, m)
      }

      userCooldowns[sender] = now
    }

    // ══════════════════════════════════════════════════════
    // 🎵 OBTENER QUERY
    let query = (text || "").replace(/^\.play\s*/i, "").trim()
    if (!query && args?.length > 0) query = args.join(" ").trim()
    if (!query) return conn.sendText(m.chat, "❗ Debes ingresar un artista y una canción.\nEjemplo: .play Canserbero - mundo de piedra", m)

    await conn.sendMessage(m.chat, { react: { text: "⌛", key: m.key } })

    // 🔎 BUSCAR VIDEO
    const searchRes = await yts.search({ query, hl: "es", gl: "ES" })
    if (!searchRes?.videos?.length) return conn.sendText(m.chat, "❌ No se encontró ningún resultado.", m)

    const video = searchRes.videos[0]
    const url = video.url
    const randomFileName = Math.random().toString(36).substring(2, 15)
    const outputPath = path.join(tempDir, `${randomFileName}.m4a`)

    // PREVIEW
    await conn.sendFile(m.chat, video.thumbnail, undefined, `🎧 *${video.title}*\n⏳ Descargando audio...`, m)

    // ══════════════════════════════════════════════════════
    // 🍪 DESCARGAR CON COOKIES (si existen)
    const cookiesFlag = existsSync(cookiesPath) ? `--cookies "${cookiesPath}"` : ""
    const cmd = `${ytDlpPath} -f "bestaudio[ext=m4a]/bestaudio/best" ${cookiesFlag} --extractor-args "youtube:player_client=default" --no-warnings -o "${outputPath}" "${url}"`

    let execResult
    try { execResult = await execAsync(cmd) }
    catch (error) { execResult = { stderr: error.stderr || error.message || "" } }

    const tmpFiles = await promises.readdir(tempDir)
    const foundFile = tmpFiles.find(f => f.startsWith(randomFileName))
    const finalPath = foundFile ? path.join(tempDir, foundFile) : outputPath

    if (!existsSync(finalPath)) return conn.sendText(m.chat, "❌ Error: archivo no generado.", m)

    const buffer = await promises.readFile(finalPath)
    await conn.sendMessage(m.chat, { audio: buffer, mimetype: "audio/mp4" }, { quoted: m })
    await promises.unlink(finalPath)
    await conn.sendMessage(m.chat, { react: { text: "✨", key: m.key } })
    console.log(`✅ ${video.title} enviado correctamente`)

  } catch (error) {
    console.error("❌ Error en plugin .play:", error.message)
    conn.sendText(m.chat, "⚠️ Error al descargar el audio.", m)
  }
}

// COMANDO
handler.command = ["play", "audio"]

export default handler
