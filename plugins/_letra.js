// plugins/letra.js — Buscar letra de cualquier canción

import fetch from 'node-fetch'

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply(`🎵 *Usa:* .letra <nombre de la canción>`)

  try {
    await m.react('🎧')

    // Buscar letra en Lyrist
    let api = `https://lyrist.vercel.app/api/${encodeURIComponent(text)}`
    let res = await fetch(api)
    let json = await res.json()

    if (!json?.lyrics) {
      await m.react('❌')
      return m.reply(`❌ No encontré la letra de esa canción.\nProbá con otro nombre.`)
    }

    let msg = `🎼 *LETRA ENCONTRADA*\n\n` +
              `💿 *${json?.title || "Título desconocido"}*\n` +
              `👤 *${json?.artist || "Artista desconocido"}*\n\n` +
              `${json.lyrics}`

    await m.react('✅')
    await conn.sendMessage(m.chat, { text: msg })
  } catch (e) {
    console.error(e)
    await m.react('⚠️')
    m.reply("⚠️ Ocurrió un error obteniendo la letra.")
  }
}

handler.help = ["letra <canción>"]
handler.tags = ["tools"]
handler.command = ["letra"]

export default handler
