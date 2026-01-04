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

    // Solo mostrar preview con mini URL
    await conn.sendMessage(m.chat, {
        image: { url: video.thumbnail },
        caption: infoText
    }, { quoted: m })
}

// Comando para descargar audio/video
handler.command = /^(ytmp3|ytmp4|play|play2)$/i
handler.register = true
handler.before = async (m, { conn, command, text }) => {
    if (!['ytmp3', 'ytmp4'].includes(command)) return

    if (!text && !m.quoted) return conn.reply(m.chat, '❌ Envía el link o menciona el mensaje con el video de YouTube', m)
    const url = text || m.quoted?.text
    const isAudio = command === 'ytmp3'

    // Función para descargar con ytdl-core
    const downloadYTDL = async (url) => {
        try {
            const info = await ytdl.getInfo(url)
            const format = ytdl.chooseFormat(info.formats, isAudio ? { quality: 'highestaudio' } : { quality: 'highest', filter: 'audioandvideo' })
            return format.url
        } catch {
            return null
        }
    }

    // Función API respaldo
    const downloadAPI = async (url) => {
        try {
            const type = isAudio ? 'ytmp3' : 'ytmp4'
            const res = await fetch(`https://api.zenkey.my.id/api/download/${type}?apikey=zenkey&url=${encodeURIComponent(url)}`)
            const data = await res.json()
            if (data.status && data.result?.download?.url) return data.result.download.url
            return null
        } catch {
            return null
        }
    }

    let mediaUrl = await downloadYTDL(url)
    if (!mediaUrl) mediaUrl = await downloadAPI(url)
    if (!mediaUrl) return conn.reply(m.chat, '❌ No se pudo descargar el contenido', m)

    // Obtener tamaño
    const size = await getFileSize(mediaUrl)
    const limit = isAudio ? LimitAud : LimitVid

    try {
        if (isAudio) {
            if (size > LimitAud) {
                await conn.sendMessage(m.chat, {
                    document: { url: mediaUrl },
                    mimetype: 'audio/mpeg',
                    fileName: `audio.mp3`
                }, { quoted: m })
            } else {
                await conn.sendMessage(m.chat, {
                    audio: { url: mediaUrl },
                    mimetype: 'audio/mpeg'
                }, { quoted: m })
            }
        } else {
            if (size > LimitVid) {
                await conn.sendMessage(m.chat, {
                    document: { url: mediaUrl },
                    fileName: `video.mp4`,
                    mimetype: 'video/mp4'
                }, { quoted: m })
            } else {
                await conn.sendMessage(m.chat, {
                    video: { url: mediaUrl },
                    mimetype: 'video/mp4',
                    caption: 'Aquí está tu video'
                }, { quoted: m })
            }
        }
    } catch (e) {
        console.error(e)
        await conn.reply(m.chat, '❌ Error al enviar el archivo', m)
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

export default handler
