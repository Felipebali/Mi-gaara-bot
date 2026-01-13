import { createCanvas } from 'canvas'
import GIFEncoder from 'gif-encoder'
import fs from 'fs'
import path from 'path'
import { sticker } from '../lib/sticker.js'

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply("❌ Usá así:\n\n.attp2 Hola mundo")
  if (text.length > 40) return m.reply("❌ Máximo 40 caracteres.")

  const width = 512
  const height = 512
  const frames = 12
  const file = `./tmp/attp2_${Date.now()}.gif`

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  const encoder = new GIFEncoder(width, height)
  encoder.createReadStream().pipe(fs.createWriteStream(file))
  encoder.start()
  encoder.setRepeat(0)
  encoder.setDelay(80)
  encoder.setQuality(10)

  for (let i = 0; i < frames; i++) {
    ctx.clearRect(0, 0, width, height)

    // fondo negro
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, width, height)

    const glow = 10 + Math.sin(i / 2) * 8

    ctx.font = 'bold 60px Sans'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.shadowColor = '#00ffff'
    ctx.shadowBlur = glow

    ctx.fillStyle = '#00ffff'
    ctx.fillText(text, width / 2, height / 2)

    encoder.addFrame(ctx)
  }

  encoder.finish()

  const buffer = fs.readFileSync(file)
  const stiker = await sticker(buffer, false, global.packname, global.author)

  await conn.sendFile(m.chat, stiker, 'attp2.webp', '', m, true)
  fs.unlinkSync(file)
}

handler.command = ['attp2']
handler.tags = ['sticker']
handler.help = ['attp2 <texto>']

export default handler 
