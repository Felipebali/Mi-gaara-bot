import { exec } from "child_process"
import fs from "fs"
import path from "path"

const ytDlp = path.join(process.cwd(), "yt-dlp")
const cookies = path.join(process.cwd(), "cookies.txt")
const tmp = path.join(process.cwd(), "tmp")

if (!fs.existsSync(tmp)) fs.mkdirSync(tmp)

// Limpieza
function cleanTmp() {
  for (const f of fs.readdirSync(tmp)) {
    fs.unlinkSync(path.join(tmp, f))
  }
}

// Ejecutar comandos
function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 200 }, (err, stdout, stderr) => {
      if (err && !stdout) return reject(stderr || err)
      resolve(stdout + stderr)
    })
  })
}

// Buscar video
async function search(query) {
  const res = await run(`${ytDlp} "ytsearch1:${query}" --print "%(id)s"`)
  const id = res.trim()
  if (!id) throw "No se encontró resultado"
  return `https://www.youtube.com/watch?v=${id}`
}

// Descargar audio
async function getAudio(q) {
  cleanTmp()
  const url = q.startsWith("http") ? q : await search(q)

  const cmd = `${ytDlp} "${url}" \
  --cookies "${cookies}" \
  -x --audio-format mp3 \
  -o "${tmp}/audio.%(ext)s"`

  await run(cmd)

  const file = fs.readdirSync(tmp).find(v => v.endsWith(".mp3"))
  if (!file) throw "No se pudo generar el audio"
  return path.join(tmp, file)
}

// Descargar video
async function getVideo(q) {
  cleanTmp()
  const url = q.startsWith("http") ? q : await search(q)

  const cmd = `${ytDlp} "${url}" \
  --cookies "${cookies}" \
  -f "bv*+ba/b" \
  --merge-output-format mp4 \
  -o "${tmp}/video.%(ext)s"`

  await run(cmd)

  const file = fs.readdirSync(tmp).find(v => v.endsWith(".mp4"))
  if (!file) throw "No se pudo generar el video"
  return path.join(tmp, file)
}

// Handler
let handler = async (m, { conn, text, command }) => {
  if (!text) return conn.reply(m.chat, "✏️ Escribí el nombre de la canción o video", m)

  try {
    await conn.reply(m.chat, "⏳ Descargando, esperá…", m)

    if (command === "yt3") {
      const file = await getAudio(text)
      await conn.sendMessage(m.chat, {
        audio: fs.readFileSync(file),
        mimetype: "audio/mpeg"
      }, { quoted: m })
    }

    if (command === "yt4") {
      const file = await getVideo(text)
      await conn.sendMessage(m.chat, {
        video: fs.readFileSync(file)
      }, { quoted: m })
    }

  } catch (e) {
    console.log(e)
    conn.reply(m.chat, "❌ Error al descargar", m)
  }
}

handler.command = ["yt3", "yt4"]
export default handler
