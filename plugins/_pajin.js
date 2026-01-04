let handler = async (m, { conn }) => {
  let who = m.sender
  let targetJid = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0])

  let senderName = '@' + who.split('@')[0]
  let targetName = targetJid ? '@' + targetJid.split('@')[0] : null

  // Mensajes graciosos sobre ser pajero 😏
  const mensajes = [
    `😅 ${senderName} se confesó pajero frente a ${targetName || 'todos'} 😳💦`,
    `😂 ${senderName} se la pasa haciendo cosas de pajero en secreto 🙈`,
    `😎 ${senderName} no puede evitar ser un poquito pajero 🤭`,
    `🤣 ${senderName} se quedó pensando en sus cosas traviesas 😏`,
    `😏 ${senderName} está haciendo cosas de pajero, shhh... no le digas a ${targetName || 'nadie'} 🤫`
  ]

  let textMessage
  if (!targetJid || targetJid === who) {
    // Auto-confesión
    textMessage = `😅 ${senderName} admite que es un poquito pajero 🤭`
  } else {
    textMessage = mensajes[Math.floor(Math.random() * mensajes.length)]
  }

  let mentions = targetJid ? [who, targetJid] : [who]

  await conn.sendMessage(m.chat, { text: textMessage, mentions })
}

handler.command = ['pajin', 'pajero']
handler.help = ['pajin @usuario']
handler.tags = ['fun', 'nsfw']

export default handler
