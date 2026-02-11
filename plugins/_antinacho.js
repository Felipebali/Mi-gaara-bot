// ANTILINK EXACTO – SOLO ESE LINK
if (m.isGroup && m.text) {
  const blockedLink = 'https://www.instagram.com/nachorsp?igsh=MXBmNG9xemI0OTh3Zw=='

  if (m.text.includes(blockedLink)) {
    await conn.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: false,
        id: m.key.id,
        participant: m.key.participant
      }
    })
    return
  }
}
