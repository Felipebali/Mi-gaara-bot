import fetch from "node-fetch"
import { load } from "cheerio"

const handler = async (m, { conn, isOwner, isBotAdmin }) => {

  // 🔒 Reglas de seguridad
  if (!m.isGroup) return
  if (!isOwner) return
  if (!isBotAdmin) return

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
    if (!list_res.ok) return

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

    album_links = [...new Set(album_links)]
    if (!album_links.length) return

    const album_res = await fetch(album_links[Math.floor(Math.random() * album_links.length)], { headers })
    if (!album_res.ok) return

    const $ = load(await album_res.text())
    const image_urls = new Set()

    $("img[src], a[href]").each((i, el) => {
      const src = $(el).attr("src") || $(el).attr("href")
      if (src?.includes("/contents/albums/sources/") && src.endsWith(".jpg"))
        image_urls.add(src)
    })

    const images = [...image_urls]
    if (!images.length) return

    const final_image = images[Math.floor(Math.random() * images.length)]

    // 👻 Hidetag REAL (mensaje invisible)
    const participants = (await conn.groupMetadata(m.chat)).participants
    const mentions = participants.map(p => p.id)

    await conn.sendMessage(m.chat, { text: "‎", mentions })

    // 🖼️ Imagen ver una vez (sin menciones)
    await conn.sendMessage(m.chat, {
      image: { url: final_image },
      caption: "Mirá lo que pedís alzado de mrd 😤😠",
      viewOnce: true
    })

  } catch {}
}

// 🔥 ACTIVACIÓN SIN PREFIJO
handler.customPrefix = /^pax$/i
handler.command = new RegExp()
handler.group = true
handler.owner = true
handler.botAdmin = true

export default handler
