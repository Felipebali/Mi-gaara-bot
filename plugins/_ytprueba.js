import { exec } from "child_process"
import fs from "fs"
import path from "path"

const ytDlpPath = "bash -c 'chmod +x ./yt-dlp && ./yt-dlp'"
const cookiesPath = "./cookies.txt"
const tempDir = "./tmp"

if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

function cleanTmp() {
  for (const f of fs.readdirSync(tempDir)) {
    fs.unlinkSync(path.join(tempDir, f))
  }
}

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 100 }, (err, stdout, stderr) => {
      if (err && !stdout) return reject(stderr || err)
      resolve(stdout + stderr)
    })
  })
}

async function search(query) {
  const out = await run(`${ytDlpPath} "ytsearch1:${query}" --print "%(id)s"`)
  const id = out.trim()
  if (!id) throw "No se encontró resultado"
  return `https://www.youtube.com/watch?v=${id}`
}

async function audio(query) {
  cleanTmp()
  const url = query.startsWith("http") ? query : await search(query)

  await run(`${ytDlpPath} "${url}" -x --audio-format mp3 -o "${tempDir}/audio.%(ext)s" --cookies "${cookiesPath}"`)

  const file = fs.readdirSync(tempDir).find(f => f.endsWith(".mp3"))
  if (!file) throw "No se pudo generar el audio"
  return file
}

async function video(query) {
  cleanTmp()
  const url = query.startsWith("http") ? query : await search(query)

  await run(`${ytDlpPath} "${url}" -f "bv*+ba/b" --merge-output-format mp4 -o "${tempDir}/video.%(ext)s" --cookies "${cookiesPath}"`)

  const file = fs.readdirSync(tempDir).find(f => f.endsWith(".mp4"))
  if (!file) throw "No se pudo generar el video"
  return file
}

let handler = async (m, { conn, text, command }) => {
  if (!text) return conn.reply(m.chat, "🎧 Escribí el nombre o link", m)

  try {
    await conn.reply(m.chat, "⏳ Descargando...", m)

    if (command === "yt3") {
      const f = await audio(text)
      await conn.sendMessage(m.chat, { audio: fs.readFileSync(`${tempDir}/${f}`), mimetype: "audio/mpeg" }, { quoted: m })
    }

    if (command === "yt4") {
      const f = await video(text)
      await conn.sendMessage(m.chat, { video: fs.readFileSync(`${tempDir}/${f}`) }, { quoted: m })
    }

  } catch (e) {
    console.error(e)
    conn.reply(m.chat, "❌ Error al descargar", m)
  }
}

handler.command = ["yt3", "yt4"]
export default handler
