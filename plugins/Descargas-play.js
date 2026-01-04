import yts from "yt-search"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs"

const execAsync = promisify(exec)
const ytDlpPath = "./yt-dlp"
const tmpDir = "./tmp"
const cookiesPath = "./cookies.txt"

// CREAR TMP
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)

// ARTISTAS / PALABRAS PROHIBIDAS
const forbiddenWords = [
  "roa","peke77","callejero fino","anuel","l-gante","lgante",
  "hades","bad bunny","badbunny"
]

// TEXTOS
const txt = {
  banSpam: "⛔ Fuiste baneado por spam.",
  advSpam: (time, atts) => `⚠️ Esperá ${time} antes de volver a usar el comando.\nIntentos: ${atts}/4`,
  ingresarTitulo: "🎵 Escribí el nombre del video.",
  sendPreview: (isAudio, title) =>
`╔══════════════════════╗
║ 🎶 YOUTUBE ${isAudio ? "AUDIO" : "VIDEO"}
╠══════════════════════╣
║ 📌 Título:
║ ${title}
║
║ ⏳ Estado: Descargando…
║ ⚡ Calidad: Óptima
║ 🔐 Proceso seguro
╚══════════════════════╝`
}

// HANDLER
let handler = async (m, { conn, args, text, command, isOwner }) => {
  global.db = global.db || {}
  global.db.users = global.db.users || {}
  if (!global.db.users[m.sender]) global.db.users[m.sender] = { last: 0, attempts: 0, banned: false }

  const user = global.db.users[m.sender]

  // BLOQUEO SPAM / BANEADOS
  if (user.banned && !isOwner) return conn.sendMessage(m.chat, { text: txt.banSpam }, { quoted: m })
  const cooldown = 120000
  const nextTime = user.last + cooldown
  const remaining = Math.ceil((nextTime - Date.now()) / 1000)

  if (!isOwner && Date.now() - user.last < cooldown) {
    user.attempts++
    if (user.attempts > 4) { user.banned = true; return conn.sendMessage(m.chat, { text: txt.banSpam }, { quoted: m }) }
    const min = Math.floor(remaining / 60)
    const sec = remaining % 60
    return conn.sendMessage(m.chat, { text: txt.advSpam(`${min} min ${sec} seg`, user.attempts) }, { quoted: m })
  }

  if (!text) return conn.sendMessage(m.chat, { text: txt.ingresarTitulo }, { quoted: m })
  if (!isOwner) { user.last = Date.now(); user.attempts = 0 }

  // FILTRO ARTISTAS
  const queryLower = text.toLowerCase()
  if (!isOwner) {
    for (const word of forbiddenWords) if (queryLower.includes(word)) {
      await m.react("🤢")
      return conn.sendMessage(m.chat, { text: "🚫 *Ese artista o contenido no está permitido.*" }, { quoted: m })
    }
  }

  await m.react("⌛")

  // BUSCAR EN YT
  const results = await yts.search(text)
  if (!results?.videos?.length) return conn.sendMessage(m.chat, { text: "❌ No se encontró ningún resultado." }, { quoted: m })
  const video = results.videos[0]
  const titleLower = video.title.toLowerCase()
  if (!isOwner) {
    for (const word of forbiddenWords) if (titleLower.includes(word)) {
      await m.react("🤢")
      return conn.sendMessage(m.chat, { text: "🚫 *Ese artista o contenido no está permitido.*" }, { quoted: m })
    }
  }

  const isAudio = command === "play" || command === "audio"
  const ext = isAudio ? ".m4a" : ".mp4"
  const format = isAudio ? "bestaudio[ext=m4a]" : "worst"
  const randomFile = Math.random().toString(36).slice(2)
  const outPath = path.join(tmpDir, randomFile + ext)

  // PREVIEW
  await conn.sendFile(m.chat, video.thumbnail, undefined, txt.sendPreview(isAudio, video.title), m)

  try {
    const cmd = `${ytDlpPath} -f "${format}" --no-playlist --no-warnings --cookies "${cookiesPath}" -o "${outPath}" "${video.url}"`
    const { stderr } = await execAsync(cmd).catch(err => ({ stderr: err.stderr || err.message }))
    if (stderr && !stderr.toLowerCase().includes("warning")) console.error(stderr)

    const tmpFiles = fs.readdirSync(tmpDir)
    const finalFile = tmpFiles.find(f => f.startsWith(randomFile))
    if (!finalFile) return conn.sendMessage(m.chat, { text: "❌ Error: archivo no generado" }, { quoted: m })

    const fileBuffer = fs.readFileSync(path.join(tmpDir, finalFile))
    await conn.sendMessage(m.chat, { [isAudio ? "audio" : "video"]: fileBuffer, mimetype: isAudio ? "audio/mp4" : undefined }, { quoted: m })
    fs.unlinkSync(path.join(tmpDir, finalFile))
  } catch (e) {
    console.error("Play error:", e)
    return conn.sendMessage(m.chat, { text: "⚠️ Error al descargar el video." }, { quoted: m })
  }
}

handler.command = ["play","audio","video","vídeo"]
export default handler
