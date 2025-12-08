import yts from "yt-search"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs, { existsSync, promises } from "fs"
import { updateUser } from "../databaseFunctions.js"

const execAsync = promisify(exec)
const ytDlpPath = path.resolve("node_modules", "gs", "ygs")

// ✅ TEXTOS DE SEGURIDAD
const txt = {
  banSpam: "⛔ Fuiste baneado por usar demasiado rápido este comando.",
  advSpam: (time, atts) =>
    `⚠️ Esperá ${time} antes de volver a usar el comando.\nIntentos: ${atts}/4`,
  ingresarTitulo: "🎵 Escribí el nombre del video a buscar.",
  sendPreview: (isAudio, title) =>
    `${isAudio ? "🎧 Audio" : "🎬 Video"} encontrado:\n\n${title}\n\n⏳ Descargando...`,
}

// ✅ CREAR TMP SI NO EXISTE
if (!fs.existsSync("./tmp")) {
  fs.mkdirSync("./tmp")
}

let handler = async (m, { conn, args, text, isOwner, command }) => {

  // ✅ CREAR USUARIO SI NO EXISTE
  let user = global.db?.users?.[m.sender]
  if (!user) {
    user = updateUser(m.sender, {
      lastmining: 0,
      commandAttempts: 0,
      banned: false
    })
  }

  const waitTime = 210000
  let time = user.lastmining + waitTime
  let remainingTime = Math.ceil((time - new Date()) / 1000)

  // ✅ ANTISPAM
  if (new Date() - user.lastmining < waitTime && !isOwner) {
    updateUser(m.sender, { commandAttempts: user.commandAttempts + 1 })
    const newAttempts = user.commandAttempts + 1

    if (newAttempts > 4) {
      updateUser(m.sender, { banned: true })
      return conn.sendMessage(m.chat, { text: txt.banSpam }, { quoted: m })
    }

    const minutes = Math.floor(remainingTime / 60)
    const seconds = remainingTime % 60
    const formattedTime =
      minutes > 0 ? `${minutes} min ${seconds} segundos` : `${seconds} segundos`

    return conn.sendMessage(
      m.chat,
      { text: txt.advSpam(formattedTime, newAttempts) },
      { quoted: m }
    )
  }

  if (!text)
    return conn.sendMessage(
      m.chat,
      { text: txt.ingresarTitulo },
      { quoted: m }
    )

  updateUser(m.sender, { lastmining: new Date() * 1, commandAttempts: 0 })
  await m.react("⌛")

  try {
    const yt_play = await search(args.join(" "))

    const prohibido = ["anuel"]
    if (
      prohibido.some((p) =>
        yt_play[0].title.toLowerCase().includes(p.toLowerCase())
      ) &&
      !isOwner
    )
      return m.react("🤢")

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

    // ✅ DESCARGA
    const commandStr = `${ytDlpPath} -f "${format}" --no-warnings -o "${outputPath}" ${url}`

    const { stderr } = await execAsync(commandStr).catch((error) => ({
      stderr: error.stderr || error.message || "",
    }))

    const lower = stderr.toLowerCase()
    const esWarning =
      lower.includes("warning:") ||
      lower.includes("signature extraction failed") ||
      lower.includes("sabr streaming")

    if (!esWarning && stderr) return console.error(stderr)

    // ✅ BUSCAR ARCHIVO FINAL
    const tmpFiles = await promises.readdir("./tmp")
    const foundFile = tmpFiles.find((f) => f.startsWith(randomFileName))
    const finalPath = foundFile
      ? path.join("./tmp", foundFile)
      : outputPath

    if (!existsSync(finalPath)) {
      return console.error("Archivo no encontrado")
    }

    const mediaBuffer = await promises.readFile(finalPath)

    await conn.sendMessage(
      m.chat,
      { [messageType]: mediaBuffer, mimetype: mimeType },
      { quoted: m }
    )

    await promises.unlink(finalPath)
  } catch (error) {
    console.error("Error en plugin de youtube:", error)
    return conn.sendMessage(
      m.chat,
      { text: "⚠️ Ocurrió un error al procesar el video." },
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
