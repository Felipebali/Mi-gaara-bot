import axios from "axios"

let handler = async (m, { conn, text }) => {
  try {
    if (!text)
      return conn.sendMessage(m.chat, {
        text: "❌ Usá así:\n\n.ttp Hola mundo"
      }, { quoted: m })

    if (text.length > 80)
      return conn.sendMessage(m.chat, {
        text: "❌ Máximo 80 caracteres."
      }, { quoted: m })

    // ✅ GENERADOR DE IMÁGENES DE TEXTO 100% ESTABLE
    const url = `https://dummyimage.com/600x400/000/fff.png&text=${encodeURIComponent(text)}`

    const res = await axios.get(url, { responseType: "arraybuffer" })

    await conn.sendMessage(m.chat, {
      image: Buffer.from(res.data),
      caption: "🖼️ TTP en imagen (modo sin APIs rotas)"
    }, { quoted: m })

  } catch (e) {
    console.error("❌ TTP IMG ERROR:", e)
    return conn.sendMessage(m.chat, {
      text: "⚠️ Error al generar la imagen."
    }, { quoted: m })
  }
}

handler.command = ["ttp"]
export default handler
