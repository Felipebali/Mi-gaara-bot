import { exec, execSync } from "child_process"
import path from "path"
import fs from "fs"

// 🛠️ FIX PERMISOS PARA BOXMINE (se ejecuta cada vez que el bot inicia)
try {
  fs.chmodSync("yt-dlp", 0o755)
} catch {
  try { execSync("chmod +x yt-dlp") } catch {}
}

const ytDlpPath = path.join(process.cwd(), "yt-dlp")
const cookiesPath = path.join(process.cwd(), "cookies.txt")
const tempDir = path.join(process.cwd(), "tmp")

if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

// 🧹 Limpia temporales
function cleanTmp() {
  for (const f of fs.readdirSync(tempDir)) {
    fs.unlinkSync(path.join(tempDir, f))
  }
}

// ⚙️ Ejecuta comandos
function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 80 }, (err, stdout, stderr) => {
      if (err) return reject(stderr || err)
      resolve(stdout)
    })
  })
}

// 🔍 Buscar en YouTube
async function searchYouTube(query) {
  const cmd = `${ytDlpPath} "ytsearch1:${query}" --print "%(id)s"`
  const id = (await run(cmd)).trim()
  if (!id) throw "No se encontró ningún resultado"
  return `https://www.youtube.com/watch?v=${id}`
}

// 🎵 Descargar audio
async function downloadAudio(query) {
  cleanTmp()
  const url = query.startsWith("http") ? query : await searchYouTube(query)
  const out = path.join(tempDir, "%(title)s.%(ext)s")

  const cmd = `${ytDlpPath} \
  --no-check-certificate \
  --compat-options no-python-version-warning \
  --cookies "${cookiesPath}" \
  -x --audio-format mp3 \
  --force-overwrites \
  -o "${out}" "${url}"`

  await run(cmd)

  const file = fs.readdirSync(tempDir).find(f => f.endsWith(".mp3"))
  if (!file) throw "No se pudo generar el audio"
  return file
}

// 🎬 Descargar video
async function downloadVideo(query) {
  cleanTmp()
  const url = query.startsWith("http") ? query : await searchYouTube(query)
  const out = path.join(tempDir, "%(title)s.%(ext)s")

  const cmd = `${ytDlpPath} \
  --no-check-certificate \
  --compat-options no-python-version-warning \
  --cookies "${cookiesPath}" \
  -f "bv*+ba/b" \
  --merge-output-format mp4 \
  --force-overwrites \
  -o "${out}" "${url}"`

  await run(cmd)

  const file = fs.readdirSync(tempDir).find(f => f.endsWith(".mp4"))
  if (!file) throw "No se pudo generar el video"
  return file
}

// 🧠 HANDLER
let handler = async (m, { conn, text, command }) => {
  if (!text) return conn.reply(m.chat, "🎧 Escribí el nombre de la canción o video", m)

  try {
    await conn.reply(m.chat, "🔎 Buscando y descargando...", m)

    if (command === "yt3") {
      const file = await downloadAudio(text)
      const filePath = path.join(tempDir, file)
      await conn.sendMessage(m.chat, {
        audio: fs.readFileSync(filePath),
        mimetype: "audio/mpeg"
      }, { quoted: m })
    }

    if (command === "yt4") {
      const file = await downloadVideo(text)
      const filePath = path.join(tempDir, file)
      await conn.sendMessage(m.chat, {
        video: fs.readFileSync(filePath)
      }, { quoted: m })
    }

  } catch (e) {
    console.error("YT ERROR:", e)
    conn.reply(m.chat, "❌ " + e.toString().slice(0, 300), m)
  }
}

handler.command = ["yt3", "yt4"]
export default handler
