import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return conn.reply(m.chat, '🍃 Escribe el nombre o link del video.', m)

  await m.react('🔎')

  // Generar nombre temporal
  const tmpName = `yt_${Date.now()}`

  try {
    if (['play','mp3'].includes(command)) {
      // Descargar solo audio
      const cmd = `yt-dlp -x --audio-format mp3 -o "/data/data/com.termux/files/home/Mi-gaara-bot/tmp/${tmpName}.%(ext)s" "${text}"`
      await execPromise(cmd)
      const filePath = `/data/data/com.termux/files/home/Mi-gaara-bot/tmp/${tmpName}.mp3`
      if (!fs.existsSync(filePath)) throw 'No se pudo descargar el audio.'
      await conn.sendMessage(m.chat, { audio: fs.readFileSync(filePath), mimetype: 'audio/mpeg', fileName: `${tmpName}.mp3` }, { quoted: m })
      fs.unlinkSync(filePath)
    }

    if (['play2','mp4'].includes(command)) {
      // Descargar video
      const cmd = `yt-dlp -f best -o "/data/data/com.termux/files/home/Mi-gaara-bot/tmp/${tmpName}.%(ext)s" "${text}"`
      await execPromise(cmd)
      const filePath = `/data/data/com.termux/files/home/Mi-gaara-bot/tmp/${tmpName}.mp4`
      if (!fs.existsSync(filePath)) throw 'No se pudo descargar el video.'
      await conn.sendMessage(m.chat, { video: fs.readFileSync(filePath), mimetype: 'video/mp4', fileName: `${tmpName}.mp4` }, { quoted: m })
      fs.unlinkSync(filePath)
    }

    await m.react('✔️')
  } catch (e) {
    console.error(e)
    await m.react('❌')
    conn.reply(m.chat, '⚠️ Error al procesar la descarga.', m)
  }
}

// Promesa para exec
function execPromise(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) reject(error)
      else resolve(stdout)
    })
  })
}

handler.help = ['play','play2','mp3','mp4']
handler.tags = ['download']
handler.command = ['play','play2','mp3','mp4']
export default handler
