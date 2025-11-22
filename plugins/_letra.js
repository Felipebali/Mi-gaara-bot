// plugins/letra.js — .letra (nombre de canción)

import fetch from "node-fetch"

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply("🎵 *Escribe el nombre de una canción.*\nEjemplo: *.letra despacito*")

  await m.react("🎧")

  try {
    // 1️⃣ Buscar canción en Genius
    const search = await fetch(`https://some-random-api.com/lyrics?title=${encodeURIComponent(text)}`)
    const json = await search.json()

    if (!json || !json.lyrics) {
      await m.react("❌")
      return m.reply("❌ *No encontré la letra.* Intenta con otro nombre.")
    }

    const artista = json.author || "Artista desconocido"
    const titulo = json.title || text
    const letra = json.lyrics.substring(0, 6000) // evita overflow
    const partes = letra.split("\n")

    await m.react("✅")

    return conn.sendMessage(m.chat, {
      text: `🎶 *${titulo} — ${artista}*\n\n${letra}`
    }, { quoted: m })

  } catch (e) {
    console.log(e)
    await m.react("⚠️")
    return m.reply("⚠️ Error buscando la letra. Probá otra vez.")
  }
}

handler.help = ["letra"]
handler.tags = ["music"]
handler.command = /^letra$/i

export default handler
