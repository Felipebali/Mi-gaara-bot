import axios from "axios"
import { sticker } from "../lib/sticker.js"

let handler = async (m, { conn, text }) => {
  try {
    if (!text)
      return conn.reply(m.chat, "❌ Usá así:\n\n.ttp Hola mundo", m)

    if (text.length > 80)
      return conn.reply(m.chat, "❌ Máximo 80 caracteres.", m)

    await m.react('🎨')

    // PNG transparente con texto blanco
    const url = `https://skizo.tech/api/ttp?text=${encodeURIComponent(text)}`

    const res = await axios.get(url, {
      responseType: "arraybuffer",
      headers: { 'User-Agent': 'FelixCat-Bot' }
    })

    const imgBuffer = Buffer.from(res.data)

    // 👉 CONVERSIÓN A STICKER (WEBP)
    const stick = await sticker(
      imgBuffer,
      false,
      global.packname,
      global.author
    )

    // 👉 ENVÍA STICKER (NO imagen)
    await conn.sendFile(
      m.chat,
      stick,
      'ttp.webp',
      '',
      m,
      true
    )

    await m.react('✅')

  } catch (e) {
    console.error(e)
    await m.react('⚠️')
    await conn.reply(m.chat, "⚠️ Error al generar el sticker.", m)
  }
}

handler.command = ['ttp']
handler.tags = ['sticker']
handler.help = ['ttp <texto>']

export default handler
