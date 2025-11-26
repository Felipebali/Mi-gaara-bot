// 📂 plugins/qc.js — QC súper estable, SIN errores JSON
import fetch from 'node-fetch'
import { sticker } from '../lib/sticker.js'

let handler = async (m, { conn }) => {
  try {
    let q = m.quoted
    if (!q || !q.text) return m.reply("❗ *Responde a un mensaje de texto con .qc*")

    // Info del usuario citado
    let user = q.sender
    let username = await conn.getName(user)

    let avatar
    try {
      avatar = await conn.profilePictureUrl(user, "image")
    } catch {
      avatar = "https://i.imgur.com/1ZqZ1ZB.png" 
    }

    // API QC que devuelve IMAGEN DIRECTA (NO JSON)
    const url = `https://qctext.xyz/create?avatar=${encodeURIComponent(avatar)}&name=${encodeURIComponent(username)}&text=${encodeURIComponent(q.text)}`

    const img = await fetch(url)
    const buffer = await img.arrayBuffer()

    // Convertimos a sticker
    const st = await sticker(Buffer.from(buffer), false, {
      packname: "FelixCat_Bot",
      author: "Feli 😺"
    })

    await conn.sendFile(m.chat, st, "qc.webp", "", m)

  } catch (e) {
    console.log(e)
    m.reply("⚠️ *Error generando el QC.*\nIntenta otra vez.")
  }
}

handler.command = /^qc$/i
export default handler
