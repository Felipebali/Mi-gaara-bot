import fetch from 'node-fetch'

let handler = async (m, { text, conn }) => {
  if (!text) return m.reply("🎵 Escribe el nombre de la canción.")

  await m.react("🕒")

  try {
    let api = `https://lyrist.vercel.app/api/${encodeURIComponent(text)}`
    let res = await fetch(api)

    if (!res.ok) throw new Error("Error en la API principal")

    let json = await res.json()

    if (!json.lyrics) {
      await m.react("✖️")
      return m.reply("❌ No encontré la letra, intenta con artista + canción.")
    }

    let { title, artist, lyrics } = json

    let caption = `🎶 *${title}*\n👤 *${artist}*\n\n${lyrics}`

    await conn.sendMessage(m.chat, { text: caption }, { quoted: m })
    await m.react("✔️")

  } catch (e) {
    await m.react("✖️")
    return m.reply("⚠️ Error obteniendo la letra.")
  }
}

handler.command = ["lyrics", "letra"]
export default handler
