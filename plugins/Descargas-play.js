import yts from "yt-search"
import fetch from "node-fetch"
import fs, { promises, existsSync, mkdirSync } from "fs"
import path from "path"

// BASE DE DATOS
global.db = global.db || {}
global.db.users = global.db.users || {}

// 🚫 ARTISTAS / PALABRAS PROHIBIDAS
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

// TEXTOS
const txt = {
  banSpam: "⛔ Fuiste baneado por spam.",
  advSpam: (time, atts) =>
    `⚠️ Esperá ${time} antes de volver a usar el comando.\nIntentos: ${atts}/4`,
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
╚══════════════════════╝`,
}

// CREAR CARPETA TMP
if (!existsSync("./tmp")) mkdirSync("./tmp")

let handler = async (m, { conn, args, text, isOwner, command }) => {
  if (!global.db.users[m.sender])
    global.db.users[m.sender] = { lastmining: 0, commandAttempts: 0, banned: false }

  let user = global.db.users[m.sender]

  // BLOQUEO DE USUARIOS BANEADOS
  if (user.banned && !isOwner) return conn.sendMessage(m.chat, { text: txt.banSpam }, { quoted: m })

  // COOLDOWN → 2 MINUTOS
  const waitTime = 120000
  const time = user.lastmining + waitTime
  const remainingTime = Math.ceil((time - new Date()) / 1000)

  if (!isOwner && new Date() - user.lastmining < waitTime) {
    user.commandAttempts++
    if (user.commandAttempts > 4) {
      user.banned = true
      return conn.sendMessage(m.chat, { text: txt.banSpam }, { quoted: m })
    }

    const minutes = Math.floor(remainingTime / 60)
    const seconds = remainingTime % 60
    const formattedTime = minutes > 0 ? `${minutes} min ${seconds} seg` : `${seconds} seg`

    return conn.sendMessage(m.chat, { text: txt.advSpam(formattedTime, user.commandAttempts) }, { quoted: m })
  }

  if (!text) return conn.sendMessage(m.chat, { text: txt.ingresarTitulo }, { quoted: m })

  if (!isOwner) {
    user.lastmining = Date.now()
    user.commandAttempts = 0
  }

  const queryLower = text.toLowerCase()
  if (!isOwner) {
    for (const word of forbiddenWords)
      if (queryLower.includes(word))
        return conn.sendMessage(m.chat, { text: "🚫 *Ese artista o contenido no está permitido en este bot.*" }, { quoted: m })
  }

  await m.react("⌛")

  try {
    // 1️⃣ BUSCAR VIDEO
    const searchResults = await yts(text)
    if (!searchResults || !searchResults.videos[0])
      return conn.sendMessage(m.chat, { text: "❌ No se encontró ningún resultado." }, { quoted: m })

    const video = searchResults.videos[0]
    const titleLower = video.title.toLowerCase()
    if (!isOwner) {
      for (const word of forbiddenWords)
        if (titleLower.includes(word))
          return conn.sendMessage(m.chat, { text: "🚫 *Ese artista o contenido no está permitido en este bot.*" }, { quoted: m })
    }

    await conn.sendFile(m.chat, video.thumbnail, undefined, txt.sendPreview(command === "play" || command === "audio", video.title), m)

    // 2️⃣ USAR API PÚBLICA PARA DESCARGA
    const apiUrl = `https://api.botcah.xyz/api/yt/play?url=${encodeURIComponent(video.url)}`
    const apiRes = await fetch(apiUrl)
    const data = await apiRes.json()

    if (!data || !data.result) return conn.sendMessage(m.chat, { text: "⚠️ Error al descargar el video vía API." }, { quoted: m })

    const isAudio = command === "play" || command === "audio"
    const downloadUrl = isAudio ? data.result.audio : data.result.video
    const extension = isAudio ? ".mp3" : ".mp4"
    const messageType = isAudio ? "audio" : "video"
    const mimeType = isAudio ? "audio/mpeg" : "video/mp4"

    // 3️⃣ DESCARGAR A TMP
    const randomFileName = Math.random().toString(36).substring(2, 15)
    const filePath = path.join("./tmp", randomFileName + extension)
    const fileBuffer = Buffer.from(await (await fetch(downloadUrl)).arrayBuffer())
    await promises.writeFile(filePath, fileBuffer)

    // 4️⃣ ENVIAR A WHATSAPP
    await conn.sendMessage(m.chat, { [messageType]: fileBuffer, mimetype: mimeType }, { quoted: m })

    // 5️⃣ ELIMINAR TEMPORAL
    await promises.unlink(filePath)
  } catch (e) {
    console.error("Error play:", e)
    return conn.sendMessage(m.chat, { text: "⚠️ Error al descargar el video." }, { quoted: m })
  }
}

handler.command = ["play", "audio", "video", "vídeo"]
export default handler
