// 📂 plugins/qc.js — QC funcional 2025 (sin errores, sin JSON corrupto)
import fetch from 'node-fetch'
import { sticker } from '../lib/sticker.js'

let handler = async (m, { conn }) => {
  try {
    let q = m.quoted
    if (!q || !q.text) return m.reply("❗ *Responde a un mensaje de texto con .qc*")

    // Datos del usuario citado
    let user = q.sender
    let username = await conn.getName(user)

    let avatar
    try {
      avatar = await conn.profilePictureUrl(user, "image")
    } catch {
      avatar = "https://i.imgur.com/1ZqZ1ZB.png"
    }

    // API estable que devuelve imagen en base64
    const body = {
      type: "quote",
      format: "png",
      backgroundColor: "#00000000",
      width: 512,
      height: 512,
      scale: 2,
      messages: [
        {
          avatar: avatar,
          from: username,
          text: q.text
        }
      ]
    }

    let res = await fetch("https://quote-api.ayush1.workers.dev/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })

    let output = await res.json()
    let base64 = output.image
    let buffer = Buffer.from(base64, "base64")

    // Convertir a sticker
    let st = await sticker(buffer, false, {
      packname: "FelixCat_Bot",
      author: "Feli 😺"
    })

    await conn.sendFile(m.chat, st, "qc.webp", "", m)

  } catch (e) {
    console.log(e)
    m.reply("⚠️ *Error generando el QC.*")
  }
}

handler.command = /^qc$/i
export default handler
