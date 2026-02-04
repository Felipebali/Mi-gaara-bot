import axios from "axios"
import { sticker } from "../lib/sticker.js"

let handler = async (m, { conn, text }) => {
  try {
    if (!text)
      return m.reply("❌ Escribí un texto para crear el sticker.")

    if (text.length > 50)
      return m.reply("❌ El texto no puede superar los 50 caracteres.")

    // Foto de perfil segura
    let pp = "https://i.ibb.co/dyk5QdQ/1212121212121212.png"
    try {
      const url = await conn.profilePictureUrl(m.sender, "image")
      if (typeof url === "string") pp = url
    } catch {}

    const obj = {
      type: "quote",
      format: "png",
      backgroundColor: "#000000",
      width: 512,
      height: 768,
      scale: 2,
      messages: [
        {
          entities: [],
          avatar: true,
          from: {
            id: 1,
            name: m.name || "Usuario",
            photo: { url: pp }
          },
          text,
          replyMessage: {}
        }
      ]
    }

    const json = await axios.post(
      "https://bot.lyo.su/quote/generate",
      obj,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000
      }
    )

    if (!json?.data?.result?.image)
      throw "La API no devolvió imagen"

    const buffer = Buffer.from(json.data.result.image, "base64")
    const st = await sticker(buffer, false)

    await conn.sendMessage(
      m.chat,
      { sticker: st },
      { quoted: m }
    )

  } catch (e) {
    console.error("QC ERROR:", e)
    m.reply("⚠️ El generador de stickers está temporalmente caído.")
  }
}

handler.help = ["qc <texto>"]
handler.tags = ["sticker"]
handler.command = ["qc"]

export default handler
