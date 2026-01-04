import { exec } from "child_process"
import fs from "fs"
import path from "path"

const tmp = path.join(process.cwd(), "tmp")
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp)

const YT = "yt-dlp"   // <- usamos el yt-dlp del sistema del contenedor

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 200 }, (err, stdout, stderr) => {
      if (err && !stdout) return reject(stderr || err)
      resolve(stdout + stderr)
    })
  })
}

function cleanTmp() {
  for (const f of fs.readdirSync(tmp)) {
    fs.unlinkSync(path.join(tmp, f))
  }
}

async function search(q) {
  const out = await run(`${YT} "ytsearch1:${q}" --print "%(id)s"`)
  const id = out.trim()
  if (!id) throw "Sin resultados"
  return `https://www.youtube.com/watch?v=${id}`
}

async function getAudio(q) {
  cleanTmp()
  const url = q.startsWith("http") ? q : await search(q)

  await run(`${YT} "${url}" -x --audio-format mp3 -o "${tmp}/audio.%(ext)s"`)

  const f = fs.readdirSync(tmp).find(v => v.endsWith(".mp3"))
  if (!f) throw "No se generó el audio"
  return path.join(tmp, f)
}

async function getVideo(q) {
  cleanTmp()
  const url = q.startsWith("http") ? q : await search(q)

  await run(`${YT} "${url}" -f "bv*+ba/b" --merge-output-format mp4 -o "${tmp}/video.%(ext)s"`)

  const f = fs.readdirSync(tmp).find(v => v.endsWith(".mp4"))
  if (!f) throw "No se generó el video"
  return path.join(tmp, f)
}

let handler = async (m, { conn, text, command }) => {
  if (!text) return conn.reply(m.chat, "✏️ Escribí el nombre", m)

  try {
    await conn.reply(m.chat, "⏳ Descargando…", m)

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
    conn.reply(m.chat, "❌ Falló la descarga", m)
  }
}

handler.command = ["yt3", "yt4"]
export default handler
