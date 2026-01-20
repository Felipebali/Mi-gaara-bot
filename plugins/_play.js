import fetch from "node-fetch"
import yts from "yt-search"

let handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text?.trim())
      return conn.reply(
        m.chat,
        `❌ *Tenés que decirme qué canción buscar*\n\nEjemplo:\n${usedPrefix}${command} MC Hariel`,
        m
      )

    // ❌ Bloquear links
    if (/https?:\/\//i.test(text))
      return conn.reply(
        m.chat,
        `❌ No se permiten enlaces.\nUsá:\n${usedPrefix}${command} nombre de la canción`,
        m
      )

    await m.react("🕒")

    // 🔎 Buscar en YouTube
    const search = await yts(text)
    const video = search.videos?.[0]

    if (!video)
      return conn.reply(m.chat, "⚠ No se encontraron resultados.", m)

    const {
      title,
      thumbnail,
      timestamp,
      views,
      ago,
      url,
      author,
      seconds
    } = video

    if (seconds > 1800)
      return conn.reply(
        m.chat,
        "⚠ El audio supera el límite de duración (30 minutos).",
        m
      )

    // 🧾 Info
    const info = `🎧 *DESCARGA DE AUDIO*

🎵 *Título:* ${title}
📺 *Canal:* ${author.name}
⏱️ *Duración:* ${timestamp}
👁️ *Vistas:* ${views.toLocaleString()}
🗓️ *Publicado:* ${ago}

⏳ Preparando audio...`

    await conn.sendMessage(
      m.chat,
      { image: { url: thumbnail }, caption: info },
      { quoted: m }
    )

    // 🎧 Descargar audio (Cobalt)
    const audio = await downloadAudio(url)

    if (!audio?.url)
      throw "⚠ No se pudo obtener el audio."

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: audio.url },
        mimetype: "audio/mpeg",
        fileName: `${title}.mp3`
      },
      { quoted: m }
    )

    await m.react("✔️")

  } catch (e) {
    await m.react("✖️")
    return conn.reply(
      m.chat,
      typeof e === "string" ? e : "⚠ Error al procesar el comando.",
      m
    )
  }
}

/* ================= DESCARGA AUDIO ================= */

async function downloadAudio(url) {
  try {
    const res = await fetch("https://co.wuk.sh/api/json", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify({
        url,
        isAudioOnly: true,
        aCodec: "mp3",
        vCodec: "none",
        quality: "192"
      })
    }).then(r => r.json())

    if (!res?.url) return null
    return { url: res.url }
  } catch {
    return null
  }
}

/* ================= CONFIG ================= */

handler.command = ["play", "playaudio", "play-audio", "pa"]
handler.tags = ["descargas"]
handler.help = ["play <texto>"]
handler.group = true

export default handler
