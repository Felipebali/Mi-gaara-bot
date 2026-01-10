import fetch from "node-fetch"
import { load } from "cheerio"

const handler = async (m, { conn, isOwner }) => {

  // Solo privado + solo owner
  if (m.isGroup) return
  if (!isOwner) return

  await m.react("📦")

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  }

  const MAX_PAGES = 22697

  try {
    const page_num = Math.floor(Math.random() * MAX_PAGES) + 1
    const list_url = `https://es.xgroovy.com/photos/${page_num}/`

    const list_res = await fetch(list_url, { headers, timeout: 30000 })
    if (!list_res.ok) throw new Error("Error lista")

    const list_html = await list_res.text()
    const $list = load(list_html)

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
    if (!album_links.length) return m.react("❌")

    const selected_album = album_links[Math.floor(Math.random() * album_links.length)]

    const album_res = await fetch(selected_album, { headers, timeout: 30000 })
    if (!album_res.ok) throw new Error("Error álbum")

    const album_html = await album_res.text()
    const $ = load(album_html)

    const image_urls = new Set()

    $("img[src]").each((i, el) => {
      const src = $(el).attr("src")?.trim()
      if (src?.includes("/contents/albums/sources/") && src.endsWith(".jpg"))
        image_urls.add(src)
    })

    $("a[href]").each((i, el) => {
      const href = $(el).attr("href")?.trim()
      if (href?.includes("/contents/albums/sources/") && href.endsWith(".jpg"))
        image_urls.add(href)
    })

    const og_url = $('meta[property="og:image"]').attr("content")?.trim()
    if (og_url?.includes("/contents/albums/sources/") && og_url.endsWith(".jpg"))
      image_urls.add(og_url)

    const images = [...image_urls]
    if (images.length < 5) return m.react("❌")

    // Elegir 5 imágenes al azar
    const selected = images.sort(() => 0.5 - Math.random()).slice(0, 5)

    let lastMsg = m
    for (const img of selected) {
      lastMsg = await conn.sendMessage(m.chat, {
        image: { url: img }
      }, { quoted: lastMsg })
    }

  } catch (e) {
    console.log(e)
    m.react("❌")
  }
}

handler.command = ['pack']
handler.private = true
handler.owner = true

export default handler
