import axios from "axios"
import { sticker } from '../lib/sticker.js'

let handler = async (m, { conn, text }) => {
  try {
    if (!text)
      return m.reply("❌ Usá así:\n\n.ttp2 Hola mundo")

    if (text.length > 40)
      return m.reply("❌ Máximo 40 caracteres.")

    // 🌈 Generador ATTP estable (neón + movimiento)
    const url = `https://widipe.com/attp?text=${encodeURIComponent(text)}`

    const res = await axios.get(url, { responseType: "arraybuffer" })
    const gif = Buffer.from(res.data)

    const stiker = await sticker(gif, false, global.packname, global.author)

    await conn.sendFile(
      m.chat,
      stiker,
      'ttp2.webp',
      '',
      m,
      true
    )

  } catch (e) {
    console.error("❌ TTP2 ERROR:", e)
    return m.reply("⚠️ No se pudo generar el sticker.")
  }
}

handler.command = ['ttp2']
handler.tags = ['sticker']
handler.help = ['ttp2 <texto>']

export default handler
