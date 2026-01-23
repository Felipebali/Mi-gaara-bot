import fetch from "node-fetch"
import yts from "yt-search"

// ============================
// 🧊 Sistema de cooldown
// ============================
const cooldowns = new Map()
const COOLDOWN_TIME = 2 * 60 * 1000 // 2 minutos

const handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    const isOwner = global.owner?.some(([id]) => m.sender.includes(id))
    const isAdmin = m.isGroup && (m.isAdmin || m.isSuperAdmin)

    // ⚠️ Cooldown para usuarios normales
    if (!isOwner && !isAdmin) {
      const now = Date.now()
      const last = cooldowns.get(m.sender) || 0
      const remaining = COOLDOWN_TIME - (now - last)
      if (remaining > 0) {
        return conn.reply(
          m.chat, 
          `🧊 Espera *${Math.ceil(remaining / 1000)}s* para usar *${usedPrefix}${command}*`, 
          m
        )
      }
      cooldowns.set(m.sender, now)
    }

    if (!text) return conn.reply(m.chat, '🍃 Escribe el nombre o link del video.', m)

    await m.react('🔎')

    // Buscar video en YouTube
    const search = await yts(text)
    const video = search.videos[0]
    if (!video) throw 'No se encontraron resultados.'

    // Info del video
    const info = `
🎵 *${video.title}*
👤 *Canal:* ${video.author.name}
⏱️ *Duración:* ${video.timestamp}
👁️ *Vistas:* ${video.views.toLocaleString()}
🔗 ${video.url}
`.trim()

    await conn.sendMessage(m.chat, { image: { url: video.thumbnail }, caption: info }, { quoted: m })

    // ============================
    // 🔊 Descargar audio
    // ============================
    if (['play','mp3'].includes(command)) {
      await m.react('🎧')
      const audio = await getAudio(video.url)
      if (!audio) throw '⚠️ No se pudo descargar el audio.'
      await conn.sendMessage(
        m.chat, 
        { audio: { url: audio }, mimetype: 'audio/mpeg', fileName: `${video.title}.mp3` }, 
        { quoted: m }
      )
    }

    // ============================
    // 🎥 Descargar video
    // ============================
    if (['play2','mp4'].includes(command)) {
      await m.react('🎬')
      const mp4 = await getVideo(video.url)
      if (!mp4) throw '⚠️ No se pudo descargar el video.'
      await conn.sendMessage(
        m.chat, 
        { video: { url: mp4 }, mimetype: 'video/mp4', fileName: `${video.title}.mp4` }, 
        { quoted: m }
      )
    }

    await m.react('✔️')

  } catch (e) {
    console.error(e)
    await m.react('❌')
    conn.reply(m.chat, '⚠️ Error al procesar la descarga.', m)
  }
}

handler.help = ['play','play2','mp3','mp4']
handler.tags = ['download']
handler.command = ['play','play2','mp3','mp4']
export default handler

// ============================
// 📥 Función para descargar audio
// ============================
async function getAudio(url) {
  const apis = [
    `https://co.wuk.sh/api/json?url=${encodeURIComponent(url)}`,
    `https://yt1s.ltd/api/json/mp3?url=${encodeURIComponent(url)}`,
    `https://api.vevioz.com/api/button/mp3/${encodeURIComponent(url)}`
  ]
  for (const api of apis) {
    try {
      const res = await fetch(api)
      const json = await res.json()
      if (json.url || json.download_url) return json.url || json.download_url
    } catch {}
  }
  return null
}

// ============================
// 🎥 Función para descargar video
// ============================
async function getVideo(url) {
  const apis = [
    `https://co.wuk.sh/api/json?url=${encodeURIComponent(url)}`,
    `https://yt1s.ltd/api/json/mp4?url=${encodeURIComponent(url)}`
  ]
  for (const api of apis) {
    try {
      const res = await fetch(api)
      const json = await res.json()
      if (json.url || json.download_url) return json.url || json.download_url
    } catch {}
  }
  return null
}
