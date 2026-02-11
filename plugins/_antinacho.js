let handler = async (m, { conn, isBotAdmin }) => {
  if (!m.isGroup) return
  if (!isBotAdmin) return
  if (!m.text) return

  // LINK ESPECÍFICO A BLOQUEAR
  const linkBloqueado = "https://www.instagram.com/nachorsp"

  if (!m.text.includes(linkBloqueado)) return

  try {
    await conn.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: false,
        id: m.key.id,
        participant: m.key.participant
      }
    })
  } catch (e) {
    console.error("ANTILINK ERROR:", e)
  }
}

// 🚫 SIN COMANDO – ACTIVO SIEMPRE
handler.command = []
handler.group = true
handler.botAdmin = true

export default handler 
