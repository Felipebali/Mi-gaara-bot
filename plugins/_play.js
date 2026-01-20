import fetch from "node-fetch"
import yts from "yt-search"

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const ctxErr = global.rcanalx || {}
  const ctxOk = global.rcanalr || {}

  try {
    if (!text?.trim())
      return conn.reply(m.chat, `❀ Por favor, ingresa el nombre de la música a descargar.`, m, ctxErr)

    await m.react('🕒')

    const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/)
    const query = videoMatch ? `https://youtu.be/${videoMatch[1]}` : text

    const search = await yts(query)
    const result = videoMatch
      ? search.videos.find(v => v.videoId === videoMatch[1])
      : search.videos[0]

    if (!result) throw 'ꕥ No se encontraron resultados.'

    const { title, thumbnail, timestamp, views, ago, url, author, seconds } = result
    if (seconds > 1800) throw '⚠ El contenido supera el límite de duración (30 minutos).'

    const info = `╭──❀ Detalles del contenido ❀──╮
🎀 Título » *${title}*
🌸 Canal » *${author.name}*
🍃 Vistas » *${formatViews(views)}*
⏳ Duración » *${timestamp}*
🗓️ Publicado » *${ago}*
🔗 Link » *${url}*
╰──────────────────────╯

> 🌷 Preparando descarga...`

    const thumb = (await conn.getFile(thumbnail)).data

    const [, media] = await Promise.all([
      conn.sendMessage(m.chat, { image: thumb, caption: info }, { quoted: m }),
      processDownload(command, url)
    ])

    if (!media?.url) throw '⚠ No se pudo obtener el contenido.'

    if (isAudio(command)) {
      await conn.sendMessage(m.chat, {
        audio: { url: media.url },
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`
      }, { quoted: m })
    } else {
      await conn.sendFile(m.chat, media.url, `${title}.mp4`, `🎬 ${title}`, m)
    }

    await m.react('✔️')

  } catch (e) {
    await m.react('✖️')
    return conn.reply(
      m.chat,
      typeof e === 'string'
        ? e
        : `⚠ Error inesperado.\nUsa *${usedPrefix}report*.\n\n${e.message}`,
      m,
      ctxErr
    )
  }
}

/* ================= UTILIDADES ================= */

const isAudio = cmd =>
  ['play', 'yta', 'ytmp3', 'playaudio', 'ytaudio'].includes(cmd)

const isVideo = cmd =>
  ['play2', 'ytv', 'ytmp4', 'mp4'].includes(cmd)

/* ================= DESCARGAS ================= */

async function processDownload(command, url) {
  if (isAudio(command)) return await getAudio(url)
  if (isVideo(command)) return await getVideo(url)
  return null
}

/* ========= AUDIO (COBALT + FALLBACK) ========= */

async function getAudio(url) {
  const apis = [
    {
      name: 'Cobalt',
      fetcher: () => cobalt(url, true)
    },
    {
      name: 'Yupra',
      fetcher: () => jsonFetch(
        `${global.APIs.yupra.url}/api/downloader/ytmp3?url=${encodeURIComponent(url)}`,
        r => r.result?.link
      )
    }
  ]
  return await tryApis(apis)
}

/* ========= VIDEO (COBALT + FALLBACK) ========= */

async function getVideo(url) {
  const apis = [
    {
      name: 'Cobalt',
      fetcher: () => cobalt(url, false)
    },
    {
      name: 'Yupra',
      fetcher: () => jsonFetch(
        `${global.APIs.yupra.url}/api/downloader/ytmp4?url=${encodeURIComponent(url)}`,
        r => r.result?.formats?.[0]?.url
      )
    }
  ]
  return await tryApis(apis)
}

/* ================= COBALT ================= */

async function cobalt(url, audioOnly = true) {
  const res = await fetch("https://co.wuk.sh/api/json", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "accept": "application/json"
    },
    body: JSON.stringify({
      url,
      isAudioOnly: audioOnly,
      aCodec: audioOnly ? "mp3" : undefined,
      vCodec: audioOnly ? "none" : "h264",
      quality: "360"
    })
  }).then(r => r.json())

  if (!res?.url) return null
  return { url: res.url }
}

/* ================= HELPERS ================= */

async function tryApis(apis) {
  for (const api of apis) {
    try {
      const res = await api.fetcher()
      if (res?.url) return res
    } catch {}
  }
  return null
}

async function jsonFetch(url, extractor) {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), 8000)
  const res = await fetch(url, { signal: controller.signal }).then(r => r.json())
  const link = extractor(res)
  return link ? { url: link } : null
}

function formatViews(v) {
  if (!v) return 'No disponible'
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return v.toString()
}

handler.command = handler.help = [
  'play', 'yta', 'ytmp3', 'playaudio', 'ytaudio',
  'play2', 'ytv', 'ytmp4', 'mp4'
]
handler.tags = ['descargas']
handler.group = true

export default handler
