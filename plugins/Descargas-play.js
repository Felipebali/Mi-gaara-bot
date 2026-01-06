import yts from "yt-search"
import fetch from "node-fetch"
import crypto from "crypto"
import axios from "axios"

const cooldowns = {}
const COOLDOWN_TIME = 2 * 60 * 1000
const MAX_WARNS = 3

// ============================
// 🧹 Artistas prohibidos
// ============================
const forbiddenArtists = [
  "roa", "peke77", "callejero fino", "anuel",
  "l gante", "hades", "bad bunny"
]

// ============================
// 🗂 Base de datos
// ============================
global.db = global.db || {}
global.db.users = global.db.users || {}

const handler = async (m, { conn, text, command }) => {
  const user = m.sender
  const chatId = m.chat
  const now = Date.now()

  // ============================
  // 🚫 Filtro de artistas
  // ============================
  if (text && text.toLowerCase()) {
    for (const word of forbiddenArtists) {
      if (text.toLowerCase().includes(word)) {
        await m.react('🤢')
        return conn.reply(chatId, `🚫 No se permite contenido de *${word}*`, m)
      }
    }
  }

  // ============================
  // ⏱ Cooldown + Warns
  // ============================
  if (cooldowns[user] && now - cooldowns[user] < COOLDOWN_TIME) {
    if (!global.db.users[user]) global.db.users[user] = {}
    global.db.users[user].warns = (global.db.users[user].warns || 0) + 1

    const warns = global.db.users[user].warns
    const remaining = Math.ceil((COOLDOWN_TIME - (now - cooldowns[user])) / 1000)

    if (warns >= MAX_WARNS) {
      await conn.groupParticipantsUpdate(chatId, [user], "remove")
      delete global.db.users[user].warns
      delete cooldowns[user]
      return conn.reply(chatId, `☠️ ${user.split("@")[0]} expulsado por abuso del comando`, m)
    }

    return conn.reply(chatId, `⚠️ Espera ${remaining}s\n⚠️ Advertencias: ${warns}/${MAX_WARNS}`, m)
  }

  cooldowns[user] = now
  setTimeout(() => delete cooldowns[user], COOLDOWN_TIME)

  if (!text || !text.trim())
    return conn.reply(chatId, `📌 Escribe el nombre o link del video`, m)

  await m.react('🔎')

  const search = await yts(text)
  const result = search.videos[0]
  if (!result) return conn.reply(chatId, "❌ No se encontró nada", m)

  const { title, thumbnail, views, timestamp, ago, url, author } = result

  const info = `🎬 *${title}*
👤 *Canal:* ${author.name}
👀 *Vistas:* ${formatViews(views)}
⏱ *Duración:* ${timestamp}
📅 *Publicado:* ${ago}
🔗 ${url}`

  await conn.sendMessage(chatId, { image: { url: thumbnail }, caption: info }, { quoted: m })

  try {
    if (['play','mp3'].includes(command)) {
      await m.react('🎧')
      const audio = await savetube.download(url)
      await conn.sendMessage(chatId, { audio: { url: audio.result.download }, mimetype: 'audio/mpeg' }, { quoted: m })
      await m.react('✔️')
    }

    if (['play2','mp4'].includes(command)) {
      await m.react('🎬')
      const video = await getVid(url)
      await conn.sendMessage(chatId, { video: { url: video.url }, mimetype: 'video/mp4' }, { quoted: m })
      await m.react('✔️')
    }
  } catch (e) {
    console.error(e)
    conn.reply(chatId, `❌ Error al descargar`, m)
  }
}

handler.command = handler.help = ['play','mp3','play2','mp4']
handler.tags = ['download']
export default handler

// ============================
// 🧩 Funciones
// ============================

async function getVid(url) {
  const r = await fetch(`https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(url)}`)
  const j = await r.json()
  return { url: j?.result?.formats?.[0]?.url || j?.result?.url }
}

function formatViews(v) {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + "B"
  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M"
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K"
  return v.toString()
}

// ============================
// 🔐 SaveTube API
// ============================

const savetube = {
  youtube: u => u.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/)?.[1],

  async download(link) {
    const id = this.youtube(link)
    const info = await axios.post("https://media.savetube.me/api/v2/info", { url: link })
    const data = await decrypt(info.data.data)
    const dl = await axios.post("https://media.savetube.me/api/download", { id, downloadType: "audio", quality: "mp3", key: data.key })
    return { result: { download: dl.data.data.downloadUrl } }
  }
}

async function decrypt(enc) {
  const key = Buffer.from("C5D58EF67A7584E4A29F6C35BBC4EB12", "hex")
  const raw = Buffer.from(enc, "base64")
  const iv = raw.slice(0, 16)
  const content = raw.slice(16)
  const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv)
  return JSON.parse(Buffer.concat([decipher.update(content), decipher.final()]).toString())
}
