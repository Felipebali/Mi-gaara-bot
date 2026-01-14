import fetch from "node-fetch"
import yts from "yt-search"

// ============================
// 🧊 Cooldown system
// ============================
const cooldowns = new Map()
const COOLDOWN_TIME = 2 * 60 * 1000

const handler = async (m, { conn, text, usedPrefix, command }) => {
  try {

    const isOwner = global.owner?.some(([id]) => m.sender.includes(id))
    const isAdmin = m.isGroup && (m.isAdmin || m.isSuperAdmin)

    if (!isOwner && !isAdmin) {
      const now = Date.now()
      const last = cooldowns.get(m.sender) || 0
      const remaining = COOLDOWN_TIME - (now - last)

      if (remaining > 0) {
        return conn.reply(
          m.chat,
          `🧊 *Cooldown activo*\n\nEspera *${Math.ceil(remaining / 1000)} segundos* para volver a usar *${usedPrefix}${command}*`,
          m
        )
      }
      cooldowns.set(m.sender, now)
    }

    if (!text?.trim())
      return conn.reply(m.chat, `🍃 Escribe el nombre o enlace del video.`, m)

    await m.react('🔎')

    const search = await yts(text)
    const video = search.videos[0]
    if (!video) throw 'No se encontraron resultados.'

    const { title, thumbnail, timestamp, views, ago, url, author } = video
    const vistas = formatViews(views)

    const info = `🕸️ *Título:* ${title}
🎋 *Canal:* ${author.name}
🍊 *Vistas:* ${vistas}
🌿 *Duración:* ${timestamp}
✨ *Publicado:* ${ago}
🍉 *Link:* ${url}`

    await conn.sendMessage(
      m.chat,
      { image: { url: thumbnail }, caption: info },
      { quoted: m }
    )

    if (['play', 'mp3'].includes(command)) {
      await m.react('🎧')
      const audio = await getAudio(url)
      if (!audio) throw 'No se pudo obtener el audio.'
      await conn.sendMessage(
        m.chat,
        { audio: { url: audio }, mimetype: 'audio/mpeg', fileName: `${title}.mp3` },
        { quoted: m }
      )
    }

    if (['play2', 'mp4'].includes(command)) {
      await m.react('🎬')
      const mp4 = await getVideo(url)
      if (!mp4) throw 'No se pudo obtener el video.'
      await conn.sendMessage(
        m.chat,
        { video: { url: mp4 }, mimetype: 'video/mp4', fileName: `${title}.mp4`, caption: `> 🍃 *${title}*` },
        { quoted: m }
      )
    }

    await m.react('✔️')

  } catch (e) {
    console.error(e)
    await m.react('✖️')
    conn.reply(m.chat, '⚠️ Ocurrió un error al procesar la descarga.', m)
  }
}

handler.command = handler.help = ['play', 'play2', 'mp3', 'mp4']
handler.tags = ['download']
export default handler

// ============================
// 📥 AUDIO
// ============================
async function getAudio(url) {
  const apis = [
    `https://co.wuk.sh/api/json?url=${encodeURIComponent(url)}`,
    `https://yt1s.ltd/api/json/mp3?url=${encodeURIComponent(url)}`
  ]

  for (const api of apis) {
    try {
      const r = await fetch(api)
      const j = await r.json()
      if (j.url || j.download_url) return j.url || j.download_url
    } catch {}
  }
  return null
}

// ============================
// 🎥 VIDEO
// ============================
async function getVideo(url) {
  const apis = [
    `https://co.wuk.sh/api/json?url=${encodeURIComponent(url)}`
  ]

  for (const api of apis) {
    try {
      const r = await fetch(api)
      const j = await r.json()
      if (j.url) return j.url
    } catch {}
  }
  return null
}

// ============================
// 👁️ FORMAT VIEWS
// ============================
function formatViews(views) {
  if (!views) return "No disponible"
  if (views >= 1e9) return `${(views / 1e9).toFixed(1)}B`
  if (views >= 1e6) return `${(views / 1e6).toFixed(1)}M`
  if (views >= 1e3) return `${(views / 1e3).toFixed(1)}K`
  return views.toString()
}
