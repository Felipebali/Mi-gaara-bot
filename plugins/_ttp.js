import axios from "axios"
import { sticker } from '../lib/sticker.js'

let handler = async (m, { conn, text }) => {
  try {
    if (!text)
      return conn.reply(m.chat, "❌ Usá así:\n\n.ttp Hola mundo", m)

    if (text.length > 80)
      return conn.reply(m.chat, "❌ Máximo 80 caracteres.", m)

    await m.react('🎨')

    // ✅ TTP sin fondo + letras blancas
    const url = `https://skizo.tech/api/ttp?text=${encodeURIComponent(text)}`

    const res = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        'User-Agent': 'FelixCat-Bot'
      }
    })

    const imgBuffer = Buffer.from(res.data)

    const stiker = await sticker(
      imgBuffer,
      false,
      global.packname,
      global.author
    )

    await conn.sendFile(m.chat, stiker, 'ttp.webp', '', m, true)
    await m.react('✅')

  } catch (e) {
    console.error("❌ TTP ERROR:", e.message)
    await m.react('⚠️')
    await conn.reply(m.chat, "⚠️ Error al generar el sticker.", m)
  }
}

handler.command = ['ttp']
handler.help = ['ttp <texto>']
handler.tags = ['sticker']
export default handler
