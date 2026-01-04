import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply('📌 Escribí el nombre de la canción')

  const ytDlpPath = path.resolve('./yt-dlp')
  const cookiesPath = path.resolve('./cookies.txt')

  if (!fs.existsSync(ytDlpPath))
    return m.reply('❌ yt-dlp no está en la raíz del bot')

  if (!fs.existsSync(cookiesPath))
    return m.reply('❌ cookies.txt no está en la raíz del bot')

  if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp')

  const output = `./tmp/${Date.now()}.mp3`
  const query = `ytsearch1:${text}`

  m.reply('🔎 Buscando y descargando audio...')

  exec(
    `"${ytDlpPath}" --cookies "${cookiesPath}" -x --audio-format mp3 -o "${output}" "${query}"`,
    async (err) => {
      if (err) {
        console.error(err)
        return m.reply('❌ Error descargando el audio')
      }

      await conn.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(output),
          mimetype: 'audio/mpeg'
        },
        { quoted: m }
      )

      fs.unlinkSync(output)
    }
  )
}

handler.command = /^(yt3|yt)$/i
handler.register = true

export default handler
