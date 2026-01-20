import fetch from 'node-fetch'
import yts from 'yt-search'
import ytdl from 'ytdl-core'

const LimitAud = 725 * 1024 * 1024
const LimitVid = 425 * 1024 * 1024

let tempStorage = {}

// ================= PLAY =================
const handler = async (m, { conn, command, text, usedPrefix }) => {
  if (!text)
    return conn.reply(
      m.chat,
      `❌ Usa así:\n\n${usedPrefix + command} Billie Eilish - Bellyache`,
      m
    )

  const yt = await yts.search(text)
  const video = yt.videos?.[0]
  if (!video) return conn.reply(m.chat, '❌ No se encontraron resultados', m)

  const info = `⌘━─━─≪ *YOUTUBE* ≫─━─━⌘
★ ${video.title}
★ ${video.ago}
★ ${secondString(video.duration.seconds)}
★ ${MilesNumber(video.views)}
★ ${video.author.name}
★ ${video.url}
⌘━━━━━━━━━━━━━━⌘`

  tempStorage[m.sender] = {
    url: video.url,
    title: video.title
  }

  await conn.sendMessage(
    m.chat,
    {
      image: { url: video.thumbnail },
      caption: info + '\n\n🎶 Audio | 📽 Video'
    },
    { quoted: m }
  )
}

// ================= RESPUESTA =================
handler.before = async (m, { conn }) => {
  const text = m.text?.trim()
  if (!['🎶', 'audio', '📽', 'video'].includes(text)) return

  const data = tempStorage[m.sender]
  if (!data) return

  try {
    if (text === '🎶' || text === 'audio') {
      const audioUrl = await downloadAudio(data.url)
      if (!audioUrl) throw 'Error audio'

      await conn.sendMessage(
        m.chat,
        { audio: { url: audioUrl }, mimetype: 'audio/mpeg' },
        { quoted: m }
      )
    }

    if (text === '📽' || text === 'video') {
      const videoUrl = await downloadVideo(data.url)
      if (!videoUrl) throw 'Error video'

      await conn.sendMessage(
        m.chat,
        { video: { url: videoUrl }, mimetype: 'video/mp4' },
        { quoted: m }
      )
    }
  } catch (e) {
    await conn.reply(m.chat, '❌ Error en la descarga', m)
  } finally {
    delete tempStorage[m.sender]
  }
}

handler.command = /^(play|play2)$/i
handler.register = false

export default handler

// ================= DESCARGAS =================
async function downloadAudio(url) {
  try {
    const info = await ytdl.getInfo(url)
    const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly' })
    return format.url
  } catch {
    return null
  }
}

async function downloadVideo(url) {
  try {
    const info = await ytdl.getInfo(url)
    const format = ytdl.chooseFormat(info.formats, { quality: '18' })
    return format.url
  } catch {
    return null
  }
}

// ================= UTILS =================
function MilesNumber(n) {
  return n.toLocaleString('es-ES')
}

function secondString(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}
