import { sticker } from "../lib/sticker.js"
import axios from "axios"

let handler = async (m, { conn, text }) => {
  // ✅ Si no hay texto escrito, tomar el del citado
  let frase = text
  if (!frase && m.quoted && m.quoted.text) {
    frase = m.quoted.text
  }

  // ❌ Si no hay texto de ningún lado
  if (!frase)
    return await conn.sendMessage(
      m.chat,
      { text: "❌ Escribí un texto o citá un mensaje para crear el sticker." },
      { quoted: m }
    )

  // ❌ Límite de caracteres
  if (frase.length > 50)
    return await conn.sendMessage(
      m.chat,
      { text: "❌ El texto no puede superar los 50 caracteres." },
      { quoted: m }
    )

  // ✅ Detectar si es citado o no
  let userJid = m.quoted?.sender || m.sender
  let nombre = m.quoted?.name || m.name || "Usuario"

  // ✅ Foto del usuario correcto (citado o autor)
  const pp = await conn.profilePictureUrl(userJid, "image").catch(
    () => "https://i.ibb.co/dyk5QdQ/1212121212121212.png"
  )

  // ✅ Objeto para la API (con datos del citado)
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
          name: nombre,
          photo: { url: pp },
        },
        text: frase,
        replyMessage: {},
      },
    ],
  }

  // ✅ Generar imagen
  const json = await axios.post(
    "https://bot.lyo.su/quote/generate",
    obj,
    { headers: { "Content-Type": "application/json" } }
  )

  const buffer = Buffer.from(json.data.result.image, "base64")
  const stiker = await sticker(buffer, false)

  // ✅ Enviar sticker
  if (stiker) {
    return await conn.sendMessage(
      m.chat,
      { sticker: stiker },
      { quoted: m }
    )
  }
}

handler.command = ["qc"]
handler.admin = true       // ✅ SOLO ADMINS
handler.botAdmin = false

export default handler
