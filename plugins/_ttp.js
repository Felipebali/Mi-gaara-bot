import { sticker } from "../lib/sticker.js"

let handler = async (m, { conn, text }) => {
  try {
    if (!text)
      return conn.sendMessage(m.chat, {
        text: "❌ Usá así:\n.ttp Hola mundo"
      }, { quoted: m })

    if (text.length > 40)
      return conn.sendMessage(m.chat, {
        text: "❌ El texto no puede superar los 40 caracteres."
      }, { quoted: m })

    const svg = `
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="black"/>
        <text x="50%" y="50%" font-size="48" fill="white"
          dominant-baseline="middle" text-anchor="middle"
          font-family="Arial, Helvetica, sans-serif">
          ${text.toUpperCase()}
        </text>
      </svg>
    `

    const buffer = Buffer.from(svg)
    const stiker = await sticker(buffer, false)

    await conn.sendMessage(m.chat, { sticker: stiker }, { quoted: m })

  } catch (e) {
    console.error("TTP ERROR:", e)
    return conn.sendMessage(m.chat, {
      text: "⚠️ Error al crear el sticker."
    }, { quoted: m })
  }
}

// ✅ COMANDO PÚBLICO
handler.command = ["ttp"]
handler.botAdmin = false

export default handler 
