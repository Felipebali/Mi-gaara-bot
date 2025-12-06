import axios from "axios"

let handler = async (m, { conn, text }) => {
  try {
    if (!text) {
      return conn.sendMessage(m.chat, {
        text: "❌ Usá así:\n\n.ttp Hola mundo"
      }, { quoted: m })
    }

    if (text.length > 50) {
      return conn.sendMessage(m.chat, {
        text: "❌ Máximo 50 caracteres."
      }, { quoted: m })
    }

    // ✅ API COMPATIBLE CON TERMUX (NO SSL ROTO)
    const url = `https://api.botcahx.eu.org/api/attp?text=${encodeURIComponent(text)}`

    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 20000
    })

    const buffer = Buffer.from(res.data)

    // ✅ ENVIAR COMO STICKER REAL
    await conn.sendMessage(m.chat, {
      sticker: buffer,
      mimetype: "image/webp"
    }, { quoted: m })

  } catch (e) {
    console.error("❌ TTP ERROR:", e)

    return conn.sendMessage(m.chat, {
      text: "⚠️ Error al generar el sticker.\nLa API puede estar caída."
    }, { quoted: m })
  }
}

handler.command = ["ttp"]
export default handler
