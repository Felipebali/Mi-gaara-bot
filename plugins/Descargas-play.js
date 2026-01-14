import fetch from "node-fetch"
import yts from "yt-search"
import crypto from "crypto"
import axios from "axios"

// ================= HANDLER =================

const handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text?.trim())
      return conn.reply(m.chat, `🍃 *Usa así:*\n\n${usedPrefix}${command} nombre o link`, m)

    await m.react('🔎')

    const videoMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|shorts\/|v\/)?([a-zA-Z0-9_-]{11})/)
    const query = videoMatch ? `https://youtu.be/${videoMatch[1]}` : text

    const search = await yts(query)
    const list = search.videos?.length ? search.videos : search.all
    const result = videoMatch
      ? list.find(v => v.videoId === videoMatch[1]) || list[0]
      : list[0]

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
      const audio = await savetube.download(url)
      if (!audio.status) throw audio.error

      await conn.sendMessage(m.chat, {
        audio: { url: audio.result.download },
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`
      }, { quoted: m })
    }

    // ================= VIDEO =================
    if (['play2', 'mp4'].includes(command)) {
      await m.react('🎬')
      const video = await getVid(url)
      if (!video?.url) throw 'No se pudo obtener el video.'

      await conn.sendMessage(m.chat, {
        video: { url: video.url },
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

// ================= VIDEO API =================

async function getVid(url) {
  try {
    const r = await fetch(`https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(url)}`)
    const j = await r.json()
    return { url: j?.result?.formats?.[0]?.url || j?.result?.url }
  } catch {
    return null
  }
}

// ================= SAVETUBE =================

const savetube = {
  youtube(url) {
    const m = url.match(/([a-zA-Z0-9_-]{11})/)
    return m ? m[1] : null
  },

  async download(link) {
    try {
      const id = this.youtube(link)
      if (!id) return { status: false, error: 'ID inválido' }

      const { data: info } = await axios.post('https://media.savetube.me/api/v2/info', { url: `https://youtu.be/${id}` })
      const decrypted = await decrypt(info.data)

      const { data: dl } = await axios.post('https://media.savetube.me/api/download', {
        id, downloadType: 'audio', quality: 'mp3', key: decrypted.key
      })

      return { status: true, result: { download: dl.data.downloadUrl, title: decrypted.title } }
    } catch (e) {
      return { status: false, error: e.message }
    }
  }
}

// ================= CRYPTO =================

async function decrypt(enc) {
  const key = Buffer.from("C5D58EF67A7584E4A29F6C35BBC4EB12", "hex")
  const buf = Buffer.from(enc, "base64")
  const iv = buf.slice(0, 16)
  const content = buf.slice(16)

  const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv)
  const dec = Buffer.concat([decipher.update(content), decipher.final()])
  return JSON.parse(dec.toString())
}

// ================= UTIL =================

function formatViews(v) {
  if (!v) return 'N/A'
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return v.toString()
}
