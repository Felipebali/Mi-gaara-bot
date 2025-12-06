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

    // ✅ API ESTABLE QUE DEVUELVE WEBP DIRECTO
    const url = `https://api.xteam.xyz/attp?file&text=${encodeURIComponent(text)}`

    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 20000
    })

    if (!res.data || res.data.length < 1000)
      throw "Respuesta inválida de la API"

    const buffer = Buffer.from(res.data)

    await conn.sendMessage(m.chat, {
      sticker: buffer
    }, { quoted: m })

  } catch (e) {
    console.error("❌ TTP ERROR:", e)

    return conn.sendMessage(m.chat, {
      text: "⚠️ El generador de TTP está temporalmente fuera de servicio.\nProbá más tarde."
    }, { quoted: m })
  }
}

handler.command = ["ttp"]
export default handler
