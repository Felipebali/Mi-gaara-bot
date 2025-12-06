import axios from "axios"

let handler = async (m, { conn, text }) => {
  try {
    if (!text)
      return conn.sendMessage(m.chat, {
        text: "❌ Usá así:\n\n.ttp2 Hola mundo"
      }, { quoted: m })

    if (text.length > 60)
      return conn.sendMessage(m.chat, {
        text: "❌ Máximo 60 caracteres."
      }, { quoted: m })

    // ✅ GENERADOR DE IMÁGENES MODERNAS (SIN SSL ROTO)
    const url = `https://image.thum.io/get/width/800/crop/600/noanimate/https://dummyimage.com/800x600/111111/00ffcc.png&text=${encodeURIComponent(text)}`

    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 20000
    })

    if (!res.data) throw "No se pudo generar la imagen"

    await conn.sendMessage(m.chat, {
      image: Buffer.from(res.data),
      caption: "✨ TTP2 — Estilo moderno"
    }, { quoted: m })

  } catch (e) {
    console.error("❌ TTP2 ERROR:", e)
    return conn.sendMessage(m.chat, {
      text: "⚠️ Error al generar la imagen TTP2."
    }, { quoted: m })
  }
}

handler.command = ["ttp2"]
export default handler
