const handler = async (m, { conn, text }) => {
  if (!text) {
    return conn.reply(m.chat, '❌ Debes escribir un usuario de Instagram.\n\nEjemplo:\n.ig messi', m)
  }

  // Quitar @ si lo escribe
  if (text.startsWith('@')) text = text.slice(1)

  await m.react('🤳')

  const image = 'https://telegra.ph/file/1af5d76a06d74180fac0d.jpg'
  const instagramUrl = `https://instagram.com/${text}`

  const str = `
*[🤳🏻] INSTAGRAM DE:* @${m.sender.split('@')[0]}

*[👤] USUARIO:* @${text}

*[📌] ENLACE:* ${instagramUrl}
`.trim()

  await conn.sendFile(
    m.chat,
    image,
    'instagram.jpg',
    str,
    m,
    false,
    {
      mentions: [
        m.sender,
        `${text}@s.whatsapp.net`
      ]
    }
  )
}

handler.command = ['ig']
handler.group = false
handler.limit = false

export default handler
