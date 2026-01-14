//import fetch from "node-fetch"
import yts from "yt-search"

// ================= HANDLER =================

const handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text?.trim())
      return conn.reply(m.chat, `🍃 *Usa así:*\n\n${usedPrefix}${command} nombre o link`, m)

    await m.react('🔎')

    const match = text.match(/([a-zA-Z0-9_-]{11})/)
    const query = match ? `https://youtu.be/${match[1]}` : text

    const search = await yts(query)
    const list = search.videos?.length ? search.videos : search.all
    const result = list[0]
    if (!result) throw 'No se encontraron resultados.'

    const { title, thumbnail, timestamp, views, ago, url, author } = result

    const info = `
🕸️ *Título:* ${title}
🎋 *Canal:* ${author?.name || 'Desconocido'}
🍊 *Vistas:* ${formatViews(views)}
🌿 *Duración:* ${timestamp}
✨ *Publicado:* ${ago}
🍉 *Link:* ${url}`

    await conn.sendMessage(m.chat, { image: { url: thumbnail }, caption: info }, { quoted: m })

    // ================= AUDIO =================
    if (['play', 'mp3'].includes(command)) {
      await m.react('🎧')
      const audio = await getAudio(url)
      if (!audio) throw 'No se pudo obtener el audio.'

      await conn.sendMessage(m.chat, {
        audio: { url: audio },
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`
      }, { quoted: m })
    }

    // ================= VIDEO =================
    if (['play2', 'mp4'].includes(command)) {
      await m.react('🎬')
      const video = await getVideo(url)
      if (!video) throw 'No se pudo obtener el video.'

      await conn.sendMessage(m.chat, {
        video: { url: video },
        mimetype: 'video/mp4',
        caption: `🍃 *${title}*`
      }, { quoted: m })
    }

    await m.react('✔️')

  } catch (e) {
    console.error(e)
    await m.react('✖️')
    return conn.reply(m.chat, `⚠️ Error:\n${e}`, m)
  }
}

handler.command = handler.help = ['play', 'mp3', 'play2', 'mp4']
handler.tags = ['download']
export default handler

// ================= AUDIO BACKEND =================

async function getAudio(url) {
  const id = url.match(/([a-zA-Z0-9_-]{11})/)?.[1]
  if (!id) return null
  return `https://api.vevioz.com/api/button/mp3/${id}`
}

// ================= VIDEO BACKEND =================

async function getVideo(url) {
  try {
    const r = await fetch(`https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(url)}`)
    const j = await r.json()
    return j?.result?.formats?.[0]?.url || j?.result?.url
  } catch {
    return null
  }
}

// ================= UTIL =================

function formatViews(v) {
  if (!v) return 'N/A'
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return v.toString()
}
