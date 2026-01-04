import yts from 'yt-search'
import ytdl from 'ytdl-core'
import fetch from 'node-fetch'

const LimitAud = 725 * 1024 * 1024 // 725MB
const LimitVid = 425 * 1024 * 1024 // 425MB

const handler = async (m, { conn, command, text, usedPrefix }) => {
    if (!text) return conn.reply(
        m.chat,
        `❌ Uso incorrecto\n*Ejemplo:* ${usedPrefix + command} Billie Eilish - Bellyache`,
        m
    )

    // Buscar video
    const searchResult = await yts(text)
    if (!searchResult || !searchResult.videos || !searchResult.videos.length)
        return conn.reply(m.chat, '❌ No se encontró ningún video', m)

    const video = searchResult.videos[0]

    const infoText = `
⌘━─━─≪ *YOUTUBE* ≫─━─━⌘
★ Título: ${video.title}
★ Publicado: ${video.ago}
★ Duración: ${secondString(video.duration.seconds)}
★ Vistas: ${MilesNumber(video.views)}
★ Canal: ${video.author.name}
★ URL: ${video.url.replace(/^https?:\/\//, '')}
⌘━━─≪ YT PLAY ≫─━━⌘
`.trim()

    // Enviar info
    await conn.sendMessage(m.chat, {
        image: { url: video.thumbnail },
        caption: infoText
    }, { quoted: m })

    // Descargar audio automáticamente si el comando es .play o .ytmp3
    if (/^(play|ytmp3)$/i.test(command)) {
        await sendAudio(conn, m, video.url, video.title)
    }
}

// Función para descargar y enviar audio
async function sendAudio(conn, m, url, title) {
    let mediaUrl
    try {
        // Primero intentar ytdl
        const info = await ytdl.getInfo(url)
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' })
        mediaUrl = format.url
    } catch {
        // Si falla, usar API de respaldo
        try {
            const res = await fetch(`https://api.zenkey.my.id/api/download/ytmp3?apikey=zenkey&url=${encodeURIComponent(url)}`)
            const data = await res.json()
            mediaUrl = data?.result?.download?.url || null
        } catch {
            mediaUrl = null
        }
    }

    if (!mediaUrl) return conn.reply(m.chat, '❌ No se pudo descargar el audio', m)

    // Obtener tamaño
    const size = await getFileSize(mediaUrl)

    // Enviar como documento si es grande, si no también como documento para evitar errores
    try {
        await conn.sendMessage(m.chat, {
            document: { url: mediaUrl },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`
        }, { quoted: m })
    } catch (e) {
        console.error(e)
        await conn.reply(m.chat, '❌ Error al enviar el audio', m)
    }
}

// FUNCIONES AUXILIARES
async function getFileSize(url) {
    try {
        const res = await fetch(url, { method: 'HEAD' })
        return parseInt(res.headers.get('content-length') || 0)
    } catch {
        return 0
    }
}

function MilesNumber(number) {
    const exp = /(\d)(?=(\d{3})+(?!\d))/g
    const rep = '$1.'
    const arr = number.toString().split('.')
    arr[0] = arr[0].replace(exp, rep)
    return arr[1] ? arr.join('.') : arr[0]
}

function secondString(seconds) {
    seconds = Number(seconds)
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor((seconds % (3600 * 24)) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    const dDisplay = d > 0 ? d + (d === 1 ? ' día, ' : ' días, ') : ''
    const hDisplay = h > 0 ? h + (h === 1 ? ' hora, ' : ' horas, ') : ''
    const mDisplay = m > 0 ? m + (m === 1 ? ' minuto, ' : ' minutos, ') : ''
    const sDisplay = s > 0 ? s + (s === 1 ? ' segundo' : ' segundos') : ''
    return dDisplay + hDisplay + mDisplay + sDisplay
}

handler.command = /^(ytmp3|ytmp4|play|play2)$/i
handler.register = true

export default handler
