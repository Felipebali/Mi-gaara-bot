import { sticker } from "../lib/sticker.js"
import axios from "axios"

let handler = async (m, { conn, text }) => {
  try {
    let frase = text || m.quoted?.text
    if (!frase)
      return conn.sendMessage(m.chat, {
        text: "❌ Escribí un texto o citá un mensaje para crear el sticker."
      }, { quoted: m })

    if (frase.length > 50)
      return conn.sendMessage(m.chat, {
        text: "❌ El texto no puede superar los 50 caracteres."
      }, { quoted: m })

    const userJid = m.quoted?.sender || m.sender
    const nombre = m.quoted?.name || m.name || "Usuario"

    // Foto segura
    let pp = "https://i.ibb.co/dyk5QdQ/1212121212121212.png"
    try {
      pp = await conn.profilePictureUrl(userJid, "image")
    } catch {}

    // ✅ API alternativa (Quote Image Generator)
    const url = "https://some-random-api.com/canvas/quote"
    const { data } = await axios.get(url, {
      params: {
        avatar: pp,
        username: nombre,
        text: frase
      },
      responseType: "arraybuffer",
      timeout: 15000
    })

    const stiker = await sticker(data, false)
    await conn.sendMessage(m.chat, { sticker: stiker }, { quoted: m })

  } catch (e) {
    console.error("QC ERROR:", e)
    return conn.sendMessage(m.chat, {
      text: "⚠️ Error al generar el sticker.\nProbá de nuevo en unos minutos."
    }, { quoted: m })
  }
}

handler.command = ["qc"]
handler.botAdmin = false

export default handler
