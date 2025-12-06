import axios from "axios"

let handler = async (m, { conn, text }) => {
  try {
    if (!text)
      return conn.sendMessage(m.chat, {
        text: "❌ Usá así:\n\n.ttp Hola mundo"
      }, { quoted: m })

    if (text.length > 50)
      return conn.sendMessage(m.chat, {
        text: "❌ Máximo 50 caracteres."
      }, { quoted: m })

    // ✅ API QUE DEVUELVE STICKER YA FORMATEADO
    const url = `https://api.alyachan.dev/api/attp?text=${encodeURIComponent(text)}`

    const res = await axios.get(url, { responseType: "arraybuffer" })

    if (!res.data) throw "No se generó el sticker"

    await conn.sendMessage(m.chat, {
      sticker: Buffer.from(res.data)
    }, { quoted: m })

  } catch (e) {
    console.error("❌ TTP ERROR:", e)
    return conn.sendMessage(m.chat, {
      text: "⚠️ Error al generar el sticker. Probá más tarde."
    }, { quoted: m })
  }
}

handler.command = ["ttp"]
export default handler
