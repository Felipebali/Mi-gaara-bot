import fetch from "node-fetch"
import yts from "yt-search"

// ================= HANDLER =================
const handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text.trim())
      return conn.reply(
        m.chat,
        "🌱 Por favor, ingresa el nombre o link de la música.",
        m
      )

    await m.react("🕒")

    const videoMatch = text.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/
    )

    const query = videoMatch
      ? "https://youtu.be/" + videoMatch[1]
      : text

    const search = await yts(query)
    const result = videoMatch
      ? search.videos.find(v => v.videoId === videoMatch[1]) || search.videos[0]
      : search.videos[0]

    if (!result) throw "ꕥ No se encontraron resultados."

    const { title, thumbnail, timestamp, views, ago, url, author, seconds } = result

    if (seconds > 3600)
      throw "⚠ El contenido supera el límite de duración (1 hora)."

    const info = `✿ ׄㅤ🪷̸ㅤ𝐘𝐨𝐮𝐓𝐮𝐛𝐞 - 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐬 ˒˓ ✿

> 🎵 *Título:* ${title}
> 👤 *Canal:* ${author.name}
> 👁️ *Vistas:* ${formatViews(views)}
> ⏱️ *Duración:* ${timestamp}
> 📅 *Publicado:* ${ago}
> 🔗 *Link:* ${url}

> ✎ Enviando archivo, espere un momento...`

    const thumb = (await conn.getFile(thumbnail)).data
    await conn.sendMessage(
      m.chat,
      { image: thumb, caption: info },
      { quoted: m }
    )

    // ===== AUDIO =====
    if (["play", "mp3"].includes(command)) {
      const audio = await getAud(url)
      if (!audio?.url) throw "⚠ No se pudo obtener el audio."

      await conn.sendMessage(
        m.chat,
        {
          audio: { url: audio.url },
          fileName: `${title}.mp3`,
          mimetype: "audio/mpeg"
        },
        { quoted: m }
      )

      await m.react("✔️")
    }

    // ===== VIDEO =====
    if (["play2", "mp4"].includes(command)) {
      const video = await getVid(url)
      if (!video?.url) throw "⚠ No se pudo obtener el video."

      await conn.sendFile(
        m.chat,
        video.url,
        `${title}.mp4`,
        `🎬 ${title}`,
        m
      )

      await m.react("✔️")
    }

  } catch (e) {
    await m.react("✖️")
    return conn.reply(
      m.chat,
      typeof e === "string"
        ? e
        : "⚠ Error inesperado.\nUsa *" + usedPrefix + "report*",
      m
    )
  }
}

handler.command = handler.help = ["play", "mp3", "play2", "mp4"]
handler.tags = ["download"]
handler.group = true

export default handler

// ================= AUDIO =================
async function getAud(url) {
  const apis = [
    {
      api: "ZenzzXD",
      endpoint: `https://api.zenzxd.xyz/downloader/ytmp3?url=${encodeURIComponent(url)}`,
      extractor: r => r.data?.download_url
    },
    {
      api: "Yupra",
      endpoint: `https://api.yupra.tech/api/downloader/ytmp3?url=${encodeURIComponent(url)}`,
      extractor: r => r.result?.link
    },
    {
      api: "Vreden",
      endpoint: `https://api.vreden.my.id/api/v1/download/youtube/audio?url=${encodeURIComponent(url)}&quality=128`,
      extractor: r => r.result?.download?.url
    },
    {
      api: "Xyro",
      endpoint: `https://api.xyroinee.xyz/download/youtubemp3?url=${encodeURIComponent(url)}`,
      extractor: r => r.result?.download
    }
  ]
  return await fetchFromApis(apis)
}

// ================= VIDEO =================
async function getVid(url) {
  const apis = [
    {
      api: "ZenzzXD",
      endpoint: `https://api.zenzxd.xyz/downloader/ytmp4?url=${encodeURIComponent(url)}&resolution=360p`,
      extractor: r => r.data?.download_url
    },
    {
      api: "Yupra",
      endpoint: `https://api.yupra.tech/api/downloader/ytmp4?url=${encodeURIComponent(url)}`,
      extractor: r => r.result?.formats?.[0]?.url
    },
    {
      api: "Vreden",
      endpoint: `https://api.vreden.my.id/api/v1/download/youtube/video?url=${encodeURIComponent(url)}&quality=360`,
      extractor: r => r.result?.download?.url
    },
    {
      api: "Xyro",
      endpoint: `https://api.xyroinee.xyz/download/youtubemp4?url=${encodeURIComponent(url)}&quality=360`,
      extractor: r => r.result?.download
    }
  ]
  return await fetchFromApis(apis)
}

// ================= FETCH MULTI API =================
async function fetchFromApis(apis) {
  for (const { api, endpoint, extractor } of apis) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const res = await fetch(endpoint, { signal: controller.signal })
        .then(r => r.json())

      clearTimeout(timeout)

      const link = extractor(res)
      if (link) return { url: link, api }
    } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  return null
}

// ================= UTILS =================
function formatViews(views) {
  if (!views) return "No disponible"
  if (views >= 1e9) return (views / 1e9).toFixed(1) + "B"
  if (views >= 1e6) return (views / 1e6).toFixed(1) + "M"
  if (views >= 1e3) return (views / 1e3).toFixed(1) + "k"
  return views.toString()
}
