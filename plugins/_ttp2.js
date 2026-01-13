import axios from "axios"
import { sticker } from '../lib/sticker.js'

let handler = async (m, { conn, text }) => {
  try {
    if (!text)
      return conn.sendMessage(m.chat, {
        text: "❌ Usá así:\n\n.ttp2 Hola mundo"
      }, { quoted: m })

    if (text.length > 40)
      return conn.sendMessage(m.chat, {
        text: "❌ Máximo 40 caracteres."
      }, { quoted: m })

    // ✨ Generador GIF animado estilo neón
    const url = `https://api.erdwpe.com/api/maker/attp?text=${encodeURIComponent(text)}`

    // 📥 Descargar GIF
    const res = await axios.get(url, { responseType: "arraybuffer" })
    const gif = Buffer.from(res.data)

    // 🪄 Convertir a sticker animado
    const stiker = await sticker(gif, false, global.packname, global.author)

    // 📨 Enviar sticker
    await conn.sendFile(
      m.chat,
      stiker,
      'ttp2.webp',
      '',
      m,
      true
    )

  } catch (e) {
    console.error("❌ ATTP2 ERROR:", e)
    return conn.sendMessage(m.chat, {
      text: "⚠️ Error al generar el sticker."
    }, { quoted: m })
  }
}

handler.command = ['ttp2']
handler.help = ['ttp2 <texto>']
handler.tags = ['sticker']

export default handler
