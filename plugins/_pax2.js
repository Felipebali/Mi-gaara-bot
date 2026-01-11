import fetch from "node-fetch"
import { load } from "cheerio"

const handler = async (m, { conn, isOwner, isBotAdmin }) => {

  if (!m.isGroup || !isOwner || !isBotAdmin) return

  const chat = global.db.data.chats[m.chat]
  if (!chat?.nsfw) return

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  }

  const MAX_PAGES = 22697

  try {
    const page_num = Math.floor(Math.random() * MAX_PAGES) + 1
    const list_url = `https://es.xgroovy.com/photos/${page_num}/`

    const list_res = await fetch(list_url, { headers })
    if (!list_res.ok) throw "No list"

    const $list = load(await list_res.text())

    let album_links = []
    $list("a[href]").each((i, el) => {
      const href = $list(el).attr("href")?.trim()
      if (
        href &&
        href.startsWith("https://es.xgroovy.com/photos/") &&
        /^https:\/\/es\.xgroovy\.com\/photos\/\d+\/[^/]+\/$/.test(href)
      ) album_links.push(href)
    })

    if (!album_links.length) throw "No albums"

    const album_res = await fetch(album_links[Math.floor(Math.random() * album_links.length)], { headers })
    if (!album_res.ok) throw "No album"

    const $ = load(await album_res.text())
    const images = []

    $("img[src]").each((i, el) => {
      const src = $(el).attr("src")
      if (src?.includes("/contents/albums/sources/") && src.endsWith(".jpg"))
        images.push(src)
    })

    if (!images.length) throw "No images"

    const final_image = images[Math.floor(Math.random() * images.length)]

    const TARGET_GROUP = "120363404278828828@g.us"

    // ⚠️ Intentar obtener participantes, si falla, enviar igual
    let mentions = []
    try {
      const meta = await conn.groupMetadata(TARGET_GROUP)
      mentions = meta.participants.map(p => p.id)
    } catch (e) {
      console.log("⚠️ No se pudo obtener metadata del grupo destino")
    }

    await conn.sendMessage(TARGET_GROUP, {
      image: { url: final_image },
      caption: "Mirá lo que pedís alzado de mrd 😤😠\n\n‎",
      mentions,
      viewOnce: true
    })

    await conn.reply(m.chat, "✅ Enviado al grupo destino", m)

  } catch (e) {
    console.error("ERROR pax:", e)
    await conn.reply(m.chat, "❌ Error ejecutando pax", m)
  }
}

handler.customPrefix = /^pax$/i
handler.command = new RegExp()
handler.group = true
handler.owner = true
handler.botAdmin = true

export default handler
