// 📂 plugins/qc.js — Quoted Sticker (FelixCat_Bot)

import fetch from 'node-fetch'
import { sticker } from '../lib/sticker.js'

let handler = async (m, { conn }) => {
  try {
    let q = m.quoted ? m.quoted : m
    if (!q.text) return m.reply("❗ *Debes responder a un mensaje de texto para generar el QC.*")
    
    // Datos del usuario citado
    let user = q.sender
    let name = await conn.getName(user)
    let pfp
    try {
      pfp = await conn.profilePictureUrl(user, 'image')
    } catch {
      pfp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png' // avatar por defecto
    }

    // API QC
    let api = `https://api.akuari.my.id/canvas/qc?text=${encodeURIComponent(q.text)}&avatar=${encodeURIComponent(pfp)}&username=${encodeURIComponent(name)}`
    let res = await fetch(api)
    let json = await res.json()

    // Crear sticker
    let buffer = await fetch(json.result).then(v => v.buffer())
    let st = await sticker(buffer, false, {
      packname: "FelixCat_Bot",
      author: "Feli 😺"
    })

    await conn.sendFile(m.chat, st, 'qc.webp', '', m)

  } catch (e) {
    console.log(e)
    return m.reply("❌ Ocurrió un error generando el QC.")
  }
}

handler.command = /^qc$/i
export default handler 
