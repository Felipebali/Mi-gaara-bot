let handler = async (m, { conn, groupMetadata }) => {
  let who = m.sender
  let targetJid = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0])

  // Si no hay mención, elegimos un miembro aleatorio del grupo (que no sea el bot ni quien envía)
  if (!targetJid && m.isGroup) {
    let participants = groupMetadata.participants
      .map(p => p.id)
      .filter(jid => jid !== who && jid !== conn.user.jid)

    if (participants.length > 0) {
      targetJid = participants[Math.floor(Math.random() * participants.length)]
    }
  }

  let senderName = '@' + who.split('@')[0]
  let targetName = targetJid ? '@' + targetJid.split('@')[0] : null

  // Mensajes graciosos sobre ser pajero 😏
  const mensajesTarget = [
    `😅 ${senderName} se confesó pajero frente a ${targetName} 😳💦`,
    `😂 ${senderName} se la pasa haciendo cosas de pajero en secreto 🙈 con ${targetName}`,
    `😎 ${senderName} no puede evitar ser un poquito pajero 🤭 cerca de ${targetName}`,
    `🤣 ${senderName} se quedó pensando en sus cosas traviesas 😏 junto a ${targetName}`,
    `😏 ${senderName} está haciendo cosas de pajero, shhh... no le digas a ${targetName} 🤫`
  ]

  const mensajesSelf = [
    `😅 ${senderName} admite que es un poquito pajero 🤭`,
    `😂 ${senderName} se está comportando como un pajero secreto 😏`,
    `😎 ${senderName} no puede evitar sus travesuras 🤫`,
    `🤣 ${senderName} está en modo pajero total 😳`,
    `😏 ${senderName} hace cosas traviesas sin que nadie lo sepa 😈`
  ]

  let textMessage
  if (!targetJid || targetJid === who) {
    // Si no hay mención o se menciona a sí mismo
    textMessage = mensajesSelf[Math.floor(Math.random() * mensajesSelf.length)]
  } else {
    // Mencionando o citando a alguien (o aleatorio del grupo)
    textMessage = mensajesTarget[Math.floor(Math.random() * mensajesTarget.length)]
  }

  let mentions = targetJid ? [who, targetJid] : [who]

  await conn.sendMessage(m.chat, { text: textMessage, mentions })
}

handler.command = ['pajin', 'pajero']
handler.help = ['pajin @usuario']
handler.tags = ['fun', 'nsfw']

export default handler
