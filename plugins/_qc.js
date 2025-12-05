import { sticker } from "../lib/sticker.js"
import axios from "axios"

let handler = async (m, { conn, text }) => {
  if (!text)
    return await conn.sendMessage(
      m.chat,
      { text: "❌ Escribí un texto para crear el sticker." },
      { quoted: m }
    )

  if (text.length > 50)
    return await conn.sendMessage(
      m.chat,
      { text: "❌ El texto no puede superar los 50 caracteres." },
      { quoted: m }
    )

  const pp = await conn.profilePictureUrl(m.sender, "image").catch(
    () => "https://i.ibb.co/dyk5QdQ/1212121212121212.png"
  )

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
          photo: { url: pp },
        },
        text: text,
        replyMessage: {},
      },
    ],
  }

  const json = await axios.post(
    "https://bot.lyo.su/quote/generate",
    obj,
    { headers: { "Content-Type": "application/json" } }
  )

  const buffer = Buffer.from(json.data.result.image, "base64")
  const stiker = await sticker(buffer, false)

  if (stiker) {
    return await conn.sendMessage(
      m.chat,
      { sticker: stiker },
      { quoted: m }
    )
  }
}

handler.command = ["qc"]
handler.botAdmin = false

export default handler 
