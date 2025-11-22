import fetch from "node-fetch"

let handler = async (m, { text }) => {
  if (!text) return m.reply("🎵 Usa: .letra <canción>")

  await m.react("🎧")

  try {

    // 1️⃣ Intentar con Lyrist (principal)
    let url1 = `https://lyrist.vercel.app/api/${encodeURIComponent(text)}`
    let res1 = await fetch(url1).catch(() => null)

    if (res1 && res1.headers.get("content-type")?.includes("application/json")) {
      let json1 = await res1.json()
      if (json1?.lyrics) {
        await m.react("✅")
        return m.reply(`🎶 *${json1.title} - ${json1.artist}*\n\n${json1.lyrics}`)
      }
    }

    // 2️⃣ Backup: Lyrics.ovh
    let url2 = `https://api.lyrics.ovh/v1/${encodeURIComponent(text)}`
    let res2 = await fetch(url2).catch(() => null)

    if (res2 && res2.headers.get("content-type")?.includes("application/json")) {
      let json2 = await res2.json()
      if (json2?.lyrics) {
        await m.react("✅")
        return m.reply(`🎶 *${text}*\n\n${json2.lyrics}`)
      }
    }

    await m.react("❌")
    return m.reply("❌ No encontré la letra. Intentá escribir también el artista.\nEj: `.letra así fue juan gabriel`")

  } catch (e) {
    console.error(e)
    await m.react("⚠️")
    return m.reply("⚠️ Error al obtener la letra.")
  }
}

handler.command = ["letra"]
export default handler
