import yts from "yt-search"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs, { existsSync, promises } from "fs"

const execAsync = promisify(exec)

// ✅ RUTA CORRECTA A yt-dlp EN TERMUX
const ytDlpPath = "yt-dlp"

// ✅ SEGURIDAD TOTAL DE BASE DE DATOS
global.db = global.db || {}
global.db.users = global.db.users || {}

// ✅ TEXTOS
const txt = {
  banSpam: "⛔ Fuiste baneado por spam.",
  advSpam: (time, atts) =>
    `⚠️ Esperá ${time} antes de volver a usar el comando.\nIntentos: ${atts}/4`,
  ingresarTitulo: "🎵 Escribí el nombre del video.",
  sendPreview: (isAudio, title) =>
    `${isAudio ? "🎧 Audio" : "🎬 Video"}:\n\n${title}\n\n⏳ Descargando...`,
}

// ✅ CREAR CARPETA TMP
if (!fs.existsSync("./tmp")) fs.mkdirSync("./tmp")

let handler = async (m, { conn, args, text, isOwner, command }) => {

  // ✅ CREAR USUARIO SI NO EXISTE
  if (!global.db.users[m.sender]) {
    global.db.users[m.sender] = {
      lastmining: 0,
      commandAttempts: 0,
      banned: false,
    }
  }

  let user = global.db.users[m.sender]

  // ✅ BLOQUEO DE BANEADOS
  if (user.banned && !isOwner) {
    return conn.sendMessage(m.chat, { text: txt.banSpam }, { quoted: m })
  }

  const waitTime = 210000
  let time = user.lastmining + waitTime
  let remainingTime = Math.ceil((time - new Date()) / 1000)

  // ✅ ANTISPAM
  if (new Date() - user.lastmining < waitTime && !isOwner) {
    user.commandAttempts++

    if (user.commandAttempts > 4) {
      user.banned = true
      return conn.sendMessage(m.chat, { text: txt.banSpam }, { quoted: m })
    }

    const minutes = Math.floor(remainingTime / 60)
    const seconds = remainingTime % 60
    const formattedTime =
      minutes > 0 ? `${minutes} min ${seconds} seg` : `${seconds} seg`

    return conn.sendMessage(
      m.chat,
      { text: txt.advSpam(formattedTime, user.commandAttempts) },
      { quoted: m }
    )
  }

  if (!text) {
    return conn.sendMessage(m.chat, { text: txt.ingresarTitulo }, { quoted: m })
  }

  user.lastmining = new Date() * 1
  user.commandAttempts = 0

  await m.react("⌛")

  try {
    const yt_play = await search(args.join(" "))

    if (!yt_play || !yt_play[0]) {
      return conn.sendMessage(
        m.chat,
        { text: "❌ No se encontró ningún resultado." },
        { quoted: m }
      )
    }

    const prohibido = ["anuel"]
    if (
      prohibido.some(p =>
        yt_play[0].title.toLowerCase().includes(p)
      ) && !isOwner
    ) return m.react("🤢")

    const url = yt_play[0].url
    const randomFileName = Math.random().toString(36).substring(2, 15)

    const isAudio = command === "play" || command === "audio"
    const format = isAudio ? "bestaudio[ext=m4a]" : "worst"
    const messageType = isAudio ? "audio" : "video"
    const mimeType = isAudio ? "audio/mp4" : undefined
    const fileExtension = isAudio ? ".m4a" : ".mp4"

    const outputPath = path.join("./tmp", `${randomFileName}${fileExtension}`)

    // ✅ PREVIEW
    await conn.sendFile(
      m.chat,
      yt_play[0].thumbnail,
      undefined,
      txt.sendPreview(isAudio, yt_play[0].title),
      m
    )

    // ✅ DESCARGA REAL CON yt-dlp
    const commandStr = `${ytDlpPath} -f "${format}" --no-playlist --no-warnings -o "${outputPath}" ${url}`

    const { stderr } = await execAsync(commandStr).catch(err => ({
      stderr: err.stderr || err.message || "",
    }))

    const lower = stderr.toLowerCase()
    if (stderr && !lower.includes("warning")) return console.error(stderr)

    // ✅ BUSCAR ARCHIVO REAL
    const tmpFiles = await promises.readdir("./tmp")
    const foundFile = tmpFiles.find(f => f.startsWith(randomFileName))
    const finalPath = foundFile
      ? path.join("./tmp", foundFile)
      : outputPath

    if (!existsSync(finalPath)) return console.error("Archivo no encontrado")

    const mediaBuffer = await promises.readFile(finalPath)

    await conn.sendMessage(
      m.chat,
      { [messageType]: mediaBuffer, mimetype: mimeType },
      { quoted: m }
    )

    await promises.unlink(finalPath)

  } catch (e) {
    console.error("Error play:", e)
    return conn.sendMessage(
      m.chat,
      { text: "⚠️ Error al descargar el video." },
      { quoted: m }
    )
  }
}

// ✅ COMANDOS
handler.command = ["play", "audio", "video", "vídeo"]
handler.botAdmin = true

export default handler

// ✅ FUNCIÓN SEARCH
async function search(query, options = {}) {
  const search = await yts.search({
    query,
    hl: "es",
    gl: "ES",
    ...options,
  })
  return search.videos
}
