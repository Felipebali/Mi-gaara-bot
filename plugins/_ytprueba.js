import { exec } from "child_process"
import path from "path"
import fs from "fs"

const ytDlpPath = "./yt-dlp"
const cookiesPath = "./cookies.txt"
const tempDir = "./tmp"

if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

// 🧹 limpiar tmp
function cleanTmp() {
  for (const f of fs.readdirSync(tempDir)) {
    fs.unlinkSync(path.join(tempDir, f))
  }
}

// ⚙️ ejecutar yt-dlp (ignora warnings)
function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 100 }, (err, stdout, stderr) => {
      if (err && !stdout) return reject(stderr || err)
      resolve(stdout + stderr)
    })
  })
}

// 🔍 buscar video
async function searchYouTube(query) {
  const out = await run(`${ytDlpPath} "ytsearch1:${query}" --print "%(id)s"`)
  const id = out.trim()
  if (!id) throw "No se encontró resultado"
  return `https://www.youtube.com/watch?v=${id}`
}

// 🎵 audio seguro
async function downloadAudio(query) {
  cleanTmp()

  const url = query.startsWith("http") ? query : await searchYouTube(query)
  const outFile = path.join(tempDir, "audio.%(ext)s")

  const cmd = `${ytDlpPath} "${url}" \
  --no-check-certificate \
  --compat-options no-python-version-warning \
  --cookies "${cookiesPath}" \
  -f "bestaudio/best" \
  --extract-audio \
  --audio-format mp3 \
  --audio-quality 0 \
  --force-overwrites \
  -o "${outFile}"`

  await run(cmd)

  const file = fs.readdirSync(tempDir).find(f => f.endsWith(".mp3"))
  if (!file) throw "No se pudo generar el audio"
  return file
}

// 🎬 video seguro
async function downloadVideo(query) {
  cleanTmp()

  const url = query.startsWith("http") ? query : await searchYouTube(query)
  const outFile = path.join(tempDir, "video.%(ext)s")

  const cmd = `${ytDlpPath} "${url}" \
  --no-check-certificate \
  --compat-options no-python-version-warning \
  --cookies "${cookiesPath}" \
  -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" \
  --merge-output-format mp4 \
  --force-overwrites \
  -o "${outFile}"`

  await run(cmd)

  const file = fs.readdirSync(tempDir).find(f => f.endsWith(".mp4"))
  if (!file) throw "No se pudo generar el video"
  return file
}

// 🧠 handler
let handler = async (m, { conn, text, command }) => {
  if (!text) return conn.reply(m.chat, "🎧 Escribí el nombre del video o canción", m)

  try {
    await conn.reply(m.chat, "🔎 Descargando…", m)

    if (command === "yt3") {
      const file = await downloadAudio(text)
      const filePath = path.join(tempDir, file)
      await conn.sendMessage(m.chat, { audio: fs.readFileSync(filePath), mimetype: "audio/mpeg" }, { quoted: m })
    }

    if (command === "yt4") {
      const file = await downloadVideo(text)
      const filePath = path.join(tempDir, file)
      await conn.sendMessage(m.chat, { video: fs.readFileSync(filePath) }, { quoted: m })
    }

  } catch (e) {
    console.error("YT ERROR:", e)
    conn.reply(m.chat, "❌ " + e.toString().slice(0, 300), m)
  }
}

handler.command = ["yt3", "yt4"]
export default handler
