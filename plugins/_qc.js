import { sticker } from '../lib/sticker.js'

let handler = async (m, { conn }) => {
  try {
    let q = m.quoted
    if (!q || !q.text) return m.reply("❗ Responde a un mensaje de texto con .qc")

    let user = q.sender
    let name = await conn.getName(user)

    let avatar
    try {
      avatar = await conn.profilePictureUrl(user, 'image')
    } catch {
      avatar = "https://i.imgur.com/1ZqZ1ZB.png"  // fallback
    }

    // 🔷 SVG generado localmente (sin canvas)
    let svg = `
<svg width="600" height="250" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" rx="20" fill="#ffffff" />
  <image href="${avatar}" x="25" y="25" width="70" height="70" clip-path="circle(35px at 35px 35px)" />
  <text x="110" y="55" font-size="28" font-weight="bold" fill="#000">${escapeXML(name)}</text>
  <foreignObject x="110" y="90" width="470" height="200">
    <div xmlns="http://www.w3.org/1999/xhtml"
         style="font-size:22px; color:#333; font-family:sans-serif; white-space:pre-wrap;">
      ${escapeXML(q.text)}
    </div>
  </foreignObject>
</svg>
`

    let svgBuffer = Buffer.from(svg)

    // Svg → Sticker (usando sticker.js interno)
    let st = await sticker(svgBuffer, false, {
      packname: "FelixCat_Bot",
      author: "Feli 😺"
    })

    await conn.sendFile(m.chat, st, "qc.webp", "", m)

  } catch (e) {
    console.log(e)
    m.reply("⚠️ Error generando QC.")
  }
}

handler.command = /^qc$/i
export default handler

function escapeXML(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}
