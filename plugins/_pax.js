import fetch from "node-fetch"
import { load } from "cheerio"

const handler = async (m, { conn, usedPrefix, isOwner, isAdmin, isBotAdmin }) => {

  if (!m.isGroup) return
  if (!isOwner) return
  if (!isBotAdmin) return

  const chat = global.db.data.chats[m.chat]
  if (chat.adultMode)
    return conn.sendMessage(
      m.chat,
      { text: `El modo adulto está deshabilitado.\nUsá *${usedPrefix}18* para habilitarlo.` },
      { quoted: m }
    )

  await m.react("🔞")

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  }

  const MAX_PAGES = 22697

  try {
    // 1. Página aleatoria
    const page_num = Math.floor(Math.random() * MAX_PAGES) + 1
    const list_url = `https://es.xgroovy.com/photos/${page_num}/`

    const list_res = await fetch(list_url, { headers, timeout: 30000 })
    if (!list_res.ok) throw "error"

    const list_html = await list_res.text()
    const $list = load(list_html)

    // 2. Obtener álbumes
    let album_links = []
    $list("a[href]").each((i, el) => {
      const href = $list(el).attr("href")?.trim()
      if (
        href &&
        href.startsWith("https://es.xgroovy.com/photos/") &&
        /^https:\/\/es\.xgroovy\.com\/photos\/\d+\/[^/]+\/$/.test(href)
      ) {
        album_links.push(href)
      }
    })

    album_links = [...new Set(album_links)]
    if (!album_links.length) return m.react("❌")

    // 3. Álbum aleatorio
    const selected_album =
      album_links[Math.floor(Math.random() * album_links.length)]

    // 4. Cargar álbum
    const album_res = await fetch(selected_album, { headers, timeout: 30000 })
    if (!album_res.ok) throw "error"

    const album_html = await album_res.text()
    const $ = load(album_html)

    // 5. Extraer imágenes
    const image_urls = new Set()

    $("img[src]").each((i, el) => {
      const src = $(el).attr("src")?.trim()
      if (
        src &&
        src.includes("/contents/albums/sources/") &&
        src.endsWith(".jpg")
      ) {
        image_urls.add(src)
      }
    })

    $("a[href]").each((i, el) => {
      const href = $(el).attr("href")?.trim()
      if (
        href &&
        href.includes("/contents/albums/sources/") &&
        href.endsWith(".jpg")
      ) {
        image_urls.add(href)
      }
    })

    const og_url = $('meta[property="og:image"]').attr("content")?.trim()
    if (
      og_url &&
      og_url.includes("/contents/albums/sources/") &&
      og_url.endsWith(".jpg")
    ) {
      image_urls.add(og_url)
    )

    const images = [...image_urls]
    if (!images.length) return m.react("❌")

    // 6. Enviar imagen final
    const final_image =
      images.length > 1
        ? images[Math.floor(Math.random() * images.length)]
        : images[0]

    await conn.sendMessage(
      m.chat,
      {
        image: { url: final_image },
        caption: "Mirá lo que pedís alzado de mrd 😤😠",
        viewOnce: true,
      },
      { quoted: m }
    )

  } catch (e) {
    console.log(e)
    m.react("❌")
  }
}

handler.command = ["pax"]
handler.group = true
handler.owner = true
handler.botAdmin = true

export default handler
