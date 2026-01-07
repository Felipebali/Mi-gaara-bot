import fetch from "node-fetch"
import yts from "yt-search"
import crypto from "crypto"
import axios from "axios"

// ============================
// 🧊 Cooldown system
// ============================
const cooldowns = new Map()
const COOLDOWN_TIME = 2 * 60 * 1000 // 2 minutos

// ============================
// ⚠️ Advertencias por spam de música
// ============================
const warns = new Map()
const MAX_WARNS = 3

const handler = async (m, { conn, text, usedPrefix, command }) => {
  try {

    // ── Cooldown + advertencias (excepto owners y admins)
    const isOwner = global.owner?.some(([id]) => m.sender.includes(id))
    const isAdmin = m.isGroup && (m.isAdmin || m.isSuperAdmin)

    if (!isOwner && !isAdmin) {
      const now = Date.now()
      const last = cooldowns.get(m.sender) || 0
      const remaining = COOLDOWN_TIME - (now - last)

      if (remaining > 0) {
        const userWarns = (warns.get(m.sender) || 0) + 1
        warns.set(m.sender, userWarns)

        const s = Math.ceil(remaining / 1000)

        if (userWarns >= MAX_WARNS) {
          return conn.reply(
            m.chat,
            `🚫 *Demasiados intentos*\n\n⚠️ Advertencias: *${userWarns}/${MAX_WARNS}*\n⏳ Espera *${s} segundos* antes de volver a pedir música.`,
            m
          )
        }

        return conn.reply(
          m.chat,
          `🧊 *Cooldown activo*\n\n⏳ Faltan *${s} segundos*\n⚠️ Advertencia: *${userWarns}/${MAX_WARNS}*`,
          m
        )
      }

      // ── Cooldown terminado → limpiar advertencias
      cooldowns.set(m.sender, now)
      warns.delete(m.sender)
    }

    if (!text?.trim())
      return conn.reply(m.chat, `*🍃 Por favor, ingresa el nombre o enlace del video.*`, m, rcanal)

    await m.react('🔎')

    const videoMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|shorts\/|v\/)?([a-zA-Z0-9_-]{11})/)
    const query = videoMatch ? `https://youtu.be/${videoMatch[1]}` : text

    const search = await yts(query)
    const allItems = (search?.videos?.length ? search.videos : search.all) || []
    const result = videoMatch
      ? allItems.find(v => v.videoId === videoMatch[1]) || allItems[0]
      : allItems[0]

    if (!result) throw 'No se encontraron resultados.'

    const { title = 'Desconocido', thumbnail, timestamp = 'N/A', views, ago = 'N/A', url = query, author = {} } = result
    const vistas = formatViews(views)

    const res3 = await fetch("https://files.catbox.moe/wfd0ze.jpg")
    const thumb3 = Buffer.from(await res3.arrayBuffer())

    const fkontak2 = {
      key: { fromMe: false, participant: "0@s.whatsapp.net" },
      message: { documentMessage: { title: "𝗗𝗘𝗦𝗖𝗔𝗥𝗚𝗔𝗡𝗗𝗢.... ..", fileName: global.botname || "Bot", jpegThumbnail: thumb3 } }
    }

    const fkontak = {
      key: { fromMe: false, participant: "0@s.whatsapp.net" },
      message: { documentMessage: { title: `「 ${title} 」`, fileName: global.botname || "Bot", jpegThumbnail: thumb3 } }
    }

    const info = `🕸️ *Título:* ${title}
🎋 *Canal:* ${author.name || 'Desconocido'}
🍊 *Vistas:* ${vistas}
🌿 *Duración:* ${timestamp}
✨ *Publicado:* ${ago}
🍉 *Link:* ${url}`

    await conn.sendMessage(
      m.chat,
      { image: { url: thumbnail }, caption: info, contextInfo: { forwardingScore: 999, isForwarded: true } },
      { quoted: fkontak2 }
    )

    if (['play', 'mp3'].includes(command)) {
      await m.react('🎧')
      const audio = await savetube.download(url)
      if (!audio?.status) throw `Error al obtener el audio: ${audio?.error || 'Desconocido'}`
      await conn.sendMessage(m.chat, { audio: { url: audio.result.download }, mimetype: 'audio/mpeg', fileName: `${title}.mp3` }, { quoted: fkontak })
      await m.react('✔️')
    }

    else if (['play2', 'mp4'].includes(command)) {
      await m.react('🎬')
      const video = await getVid(url)
      if (!video?.url) throw 'No se pudo obtener el video.'
      await conn.sendMessage(m.chat, { video: { url: video.url }, fileName: `${title}.mp4`, mimetype: 'video/mp4', caption: `> 🍃 *${title}*` }, { quoted: fkontak })
      await m.react('✔️')
    }

  } catch (e) {
    await m.react('✖️')
    console.error(e)
    const msg = typeof e === 'string' ? e : `⚠️ Ocurrió un error inesperado.\n> Usa *${usedPrefix}report* para informarlo.\n\n${e?.message || JSON.stringify(e)}`
    return conn.reply(m.chat, msg, m)
  }
}

handler.command = handler.help = ['play', 'play2', 'mp3', 'mp4']
handler.tags = ['download']
export default handler

// ============================
async function getVid(url) {
  const apis = [{ api: 'Yupra', endpoint: `https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(url)}`, extractor: res => res?.result?.formats?.[0]?.url || res?.result?.url }]
  return await fetchFromApis(apis)
}

async function fetchFromApis(apis) {
  for (const { api, endpoint, extractor } of apis) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const r = await fetch(endpoint, { signal: controller.signal })
      clearTimeout(timeout)
      const res = await r.json().catch(() => null)
      const link = extractor(res)
      if (link) return { url: link, api }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  return null
}

// ============================
function formatViews(views) {
  if (views == null) return "No disponible"
  if (views >= 1e9) return `${(views / 1e9).toFixed(1)}B`
  if (views >= 1e6) return `${(views / 1e6).toFixed(1)}M`
  if (views >= 1e3) return `${(views / 1e3).toFixed(1)}K`
  return views.toString()
}
