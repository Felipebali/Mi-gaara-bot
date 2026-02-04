import { createCanvas, loadImage } from "canvas"
import sharp from "sharp"
import { sticker } from "../lib/sticker.js"

let handler = async (m, { conn, text }) => {
  try {
    let frase = text || m.quoted?.text
    if (!frase) return m.reply("❌ Escribí un texto o citá un mensaje.")
    if (frase.length > 60) return m.reply("❌ Máx 60 caracteres.")

    const nombre = m.quoted?.name || m.name || "Usuario"
    const userJid = m.quoted?.sender || m.sender

    let pp = "https://i.ibb.co/dyk5QdQ/1212121212121212.png"
    try {
      pp = await conn.profilePictureUrl(userJid, "image")
    } catch {}

    const canvas = createCanvas(512, 512)
    const ctx = canvas.getContext("2d")

    ctx.fillStyle = "#0f0f0f"
    ctx.fillRect(0, 0, 512, 512)

    const avatar = await loadImage(pp)
    ctx.save()
    ctx.beginPath()
    ctx.arc(80, 80, 45, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(avatar, 35, 35, 90, 90)
    ctx.restore()

    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 26px Sans"
    ctx.fillText(nombre, 150, 75)

    ctx.font = "22px Sans"
    ctx.fillStyle = "#eaeaea"
    wrapText(ctx, frase, 40, 160, 430, 28)

    const img = canvas.toBuffer("image/png")
    const webp = await sharp(img).resize(512, 512).webp().toBuffer()

    const st = await sticker(webp, false)
    await conn.sendMessage(m.chat, { sticker: st }, { quoted: m })

  } catch (e) {
    console.error(e)
    m.reply("⚠️ Error al generar el sticker.")
  }
}

handler.command = ["qc"]
export default handler

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ")
  let line = ""
  for (let w of words) {
    const test = line + w + " "
    if (ctx.measureText(test).width > maxWidth) {
      ctx.fillText(line, x, y)
      line = w + " "
      y += lineHeight
    } else {
      line = test
    }
  }
  ctx.fillText(line, x, y)
}
