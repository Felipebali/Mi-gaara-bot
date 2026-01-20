import fetch from "node-fetch"
import yts from "yt-search"
import axios from "axios"

const handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text?.trim())
      return conn.reply(m.chat, `*🍃 Por favor, ingresa el nombre o enlace del video.*`, m)

    await m.react('🔎')

    const videoMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|shorts\/|v\/)?([a-zA-Z0-9_-]{11})/)
    const query = videoMatch ? `https://youtu.be/${videoMatch[1]}` : text

    const search = await yts(query)
    const allItems = (search?.videos?.length ? search.videos : search.all) || []
    const result = videoMatch
      ? allItems.find(v => v.videoId === videoMatch[1]) || allItems[0]
      : allItems[0]

    if (!result) throw 'No se encontraron resultados.'

    const { title = 'Desconocido', thumbnail, timestamp = 'N/A', views, ago = 'N/A', url, author = {} } = result
    const vistas = formatViews(views)

    const res3 = await fetch("https://files.catbox.moe/wfd0ze.jpg")
    const thumb3 = Buffer.from(await res3.arrayBuffer())

    const fkontak2 = {
      key: { fromMe: false, participant: "0@s.whatsapp.net" },
      message: {
        documentMessage: {
          title: "𝗗𝗘𝗦𝗖𝗔𝗥𝗚𝗔𝗡𝗗𝗢.... ..",
          fileName: global.botname || "Bot",
          jpegThumbnail: thumb3
        }
      }
    }

    const fkontak = {
      key: { fromMe: false, participant: "0@s.whatsapp.net" },
      message: {
        documentMessage: {
          title: `「 ${title} 」`,
          fileName: global.botname || "Bot",
          jpegThumbnail: thumb3
        }
      }
    }

    const info = `🕸️ *Título:* ${title}
🎋 *Canal:* ${author.name || 'Desconocido'}
🍊 *Vistas:* ${vistas}
🌿 *Duración:* ${timestamp}
✨ *Publicado:* ${ago}
🍉 *Link:* ${url}`

    await conn.sendMessage(
      m.chat,
      {
        image: { url: thumbnail },
        caption: info,
        contextInfo: { forwardingScore: 999, isForwarded: true }
      },
      { quoted: fkontak2 }
    )

    // ================= AUDIO =================
    if (['play', 'mp3'].includes(command)) {
      await m.react('🎧')

      const audio = await downloadAudio(url)
      if (!audio?.url) throw 'Error al obtener el audio.'

      await conn.sendMessage(
        m.chat,
        {
          audio: { url: audio.url },
          mimetype: 'audio/mpeg',
          fileName: `${title}.mp3`
        },
        { quoted: fkontak }
      )

      await m.react('✔️')
    }

    // ================= VIDEO =================
    else if (['play2', 'mp4'].includes(command)) {
      await m.react('🎬')

      const video = await getVid(url)
      if (!video?.url) throw 'No se pudo obtener el video.'

      await conn.sendMessage(
        m.chat,
        {
          video: { url: video.url },
          mimetype: 'video/mp4',
          fileName: `${title}.mp4`,
          caption: `> 🍃 *${title}*`
        },
        { quoted: fkontak }
      )

      await m.react('✔️')
    }

  } catch (e) {
    await m.react('✖️')
    console.error(e)
    return conn.reply(
      m.chat,
      typeof e === 'string'
        ? e
        : `⚠️ Ocurrió un error inesperado.\n\n${e?.message || e}`,
      m
    )
  }
}

handler.command = handler.help = ['play', 'play2', 'mp3', 'mp4']
handler.tags = ['download']
export default handler

// ================= VIDEO (YUPRA) =================
async function getVid(url) {
  try {
    const res = await fetch(`https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(url)}`)
    const json = await res.json()
    return { url: json?.result?.formats?.[0]?.url || json?.result?.url }
  } catch {
    return null
  }
}

// ================= AUDIO (COBALT) =================
async function downloadAudio(url) {
  try {
    const res = await fetch("https://co.wuk.sh/api/json", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json"
      },
      body: JSON.stringify({
        url,
        isAudioOnly: true,
        aCodec: "mp3",
        quality: "192"
      })
    })

    const json = await res.json()
    if (!json?.url) return null

    return { url: json.url }
  } catch {
    return null
  }
}

// ================= UTIL =================
function formatViews(views) {
  if (views === undefined || views === null) return "No disponible"
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`
  return views.toString()
}
