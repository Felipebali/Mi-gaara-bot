import yts from "yt-search"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import { existsSync, promises } from "fs"

const execAsync = promisify(exec)

// ✅ yt-dlp REAL (Termux / Linux / VPS)
const ytDlpPath = "yt-dlp"

const cookiesPath = "./lib/cookies.txt"

// ═══════════════════════════════════════
// 🕐 ANTI-SPAM (2 minutos)
// ═══════════════════════════════════════
const userCooldowns = {}

let handler = async (m, { conn, args, text, isOwner }) => {
  try {
    const remoteJid = m.chat
    const senderJid = m.sender

    // 🚫 COOLDOWN (owner sin límite)
    if (!isOwner) {
      const now = Date.now()
      const cooldownTime = 2 * 60 * 1000
      const lastUse = userCooldowns[senderJid] || 0
      const timeLeft = lastUse + cooldownTime - now

      if (timeLeft > 0) {
        const sec = Math.ceil(timeLeft / 1000)
        const min = Math.floor(sec / 60)
        const s = sec % 60
        const t = min > 0 ? `${min}m ${s}s` : `${s}s`

        return conn.sendMessage(
          remoteJid,
          { text: `⏰ *Espera ${t}* antes de usar *.play* de nuevo.` },
          { quoted: m }
        )
      }

      userCooldowns[senderJid] = now
    }

    // 🎵 QUERY
    let query = (text || "").trim()
    if (!query && args?.length) query = args.join(" ").trim()

    if (!query) {
      return conn.sendMessage(
        remoteJid,
        { text: "❗ Ejemplo:\n.play Canserbero - mundo de piedra" },
        { quoted: m }
      )
    }

    await conn.sendMessage(remoteJid, { react: { text: "⌛", key: m.key } })

    const results = await search(query)
    if (!results.length) {
      return conn.sendMessage(
        remoteJid,
        { text: "❌ No se encontraron resultados." },
        { quoted: m }
      )
    }

    const video = results[0]
    const url = video.url
    const randomName = Math.random().toString(36).slice(2)
    const outputPath = path.join("./tmp", `${randomName}.m4a`)

    await promises.mkdir("./tmp", { recursive: true })

    // 📸 Preview
    await conn.sendMessage(
      remoteJid,
      {
        image: { url: video.thumbnail },
        caption: `🎧 *${video.title}*\n\n⏳ Descargando audio...`
      },
      { quoted: m }
    )

    // 🍪 Cookies (opcional)
    const useCookies = existsSync(cookiesPath)
    const cookiesFlag = useCookies ? `--cookies "${cookiesPath}"` : ""

    // ✅ Comando yt-dlp ESTABLE (cliente Android)
    const cmd = `${ytDlpPath} \
-f "bestaudio[ext=m4a]/bestaudio/best" \
--extractor-args "youtube:player_client=android" \
--no-warnings \
${cookiesFlag} \
-o "${outputPath}" \
"${url}"`

    try {
      await execAsync(cmd)
    } catch (e) {
      console.error("❌ yt-dlp error:", e.stderr || e.message)
    }

    if (!existsSync(outputPath)) {
      return conn.sendMessage(
        remoteJid,
        { text: "❌ No se pudo descargar el audio." },
        { quoted: m }
      )
    }

    const audio = await promises.readFile(outputPath)
    await conn.sendMessage(
      remoteJid,
      { audio, mimetype: "audio/mp4" },
      { quoted: m }
    )

    await promises.unlink(outputPath)
    await conn.sendMessage(remoteJid, { react: { text: "✨", key: m.key } })

  } catch (e) {
    console.error("❌ Error en .play:", e)
  }
}

// ✅ COMANDO
handler.command = ["play"]

export default handler

// 🔍 BUSCADOR
async function search(query, options = {}) {
  const r = await yts.search({ query, hl: "es", gl: "ES", ...options })
  return r.videos
}
