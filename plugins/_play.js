import yts from 'yt-search'
import ytdl from 'ytdl-core'

// ================= PLAY =================
const handler = async (m, { conn, command, text, usedPrefix }) => {
  if (!text)
    return conn.reply(
      m.chat,
      `❌ Usa así:\n\n${usedPrefix + command} Billie Eilish - Bellyache`,
      m
    )

  // 🔍 Buscar en YouTube
  const yt = await yts.search(text)
  const video = yt.videos?.[0]
  if (!video) return conn.reply(m.chat, '❌ No se encontraron resultados', m)

  // ℹ️ Info
  const info = `🎶 *YOUTUBE AUDIO*
  
📌 *Título:* ${video.title}
⏱ *Duración:* ${secondString(video.duration.seconds)}
👤 *Canal:* ${video.author.name}
👁 *Vistas:* ${MilesNumber(video.views)}
🔗 ${video.url}

⏳ Descargando audio...`

  await conn.sendMessage(
    m.chat,
    { image: { url: video.thumbnail }, caption: info },
    { quoted: m }
  )

  try {
    // 🎧 Descargar audio
    const audioUrl = await downloadAudio(video.url)
    if (!audioUrl) throw 'Error audio'

    // 📤 Enviar audio directo
    await conn.sendMessage(
      m.chat,
      {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        fileName: `${video.title}.mp3`
      },
      { quoted: m }
    )
  } catch (e) {
    console.error(e)
    await conn.reply(m.chat, '❌ Error al descargar el audio', m)
  }
}

handler.command = /^(play|play2)$/i
handler.register = false
export default handler

// ================= DESCARGA AUDIO =================
async function downloadAudio(url) {
  try {
    const info = await ytdl.getInfo(url)
    const format = ytdl.chooseFormat(info.formats, {
      filter: 'audioonly',
      quality: 'highestaudio'
    })
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
