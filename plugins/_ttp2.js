import axios from "axios"

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

    // ✅ GENERADOR DIFERENTE Y ESTABLE (STICKER REAL)
    const url = `http://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`

    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 15000
    })

    if (!res.data) throw "No se generó el buffer"

    // ✅ ENVÍO COMO STICKER (NO IMAGEN)
    await conn.sendMessage(m.chat, {
      sticker: Buffer.from(res.data)
    }, { quoted: m })

  } catch (e) {
    console.error("❌ TTP2 STICKER ERROR:", e)
    return conn.sendMessage(m.chat, {
      text: "⚠️ Error al generar el sticker TTP2."
    }, { quoted: m })
  }
}

handler.command = ["ttp2"]
export default handler 
