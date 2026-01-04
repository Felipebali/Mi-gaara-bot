// 📂 plugins/pajin.js
let handler = async (m, { conn, participants, groupMetadata }) => {
  try {
    if (!participants || participants.length < 2) {
      return conn.sendMessage(m.chat, { text: '👥 Se necesitan al menos *2 personas* en el grupo para usar .pajin.' });
    }

    let who = m.sender
    let senderName = '@' + who.split('@')[0]

    // Determinar target:
    // 1️⃣ Si se mencionó o citó → usar ese usuario
    // 2️⃣ Si no → elegir un participante aleatorio del grupo
    let targetJid
    if (m.quoted) targetJid = m.quoted.sender
    else if (m.mentionedJid && m.mentionedJid[0]) targetJid = m.mentionedJid[0]
    else {
      // Elegir un participante aleatorio que no sea el bot ni quien envía
      let others = participants.map(p => p.id).filter(jid => jid !== who && jid !== conn.user.jid)
      targetJid = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : null
    }

    let targetName = targetJid ? '@' + targetJid.split('@')[0] : 'alguien'

    // Frases traviesas aleatorias
    const frases = [
      `😏 ${senderName} se está comportando como un pajero con ${targetName} 🤭`,
      `😂 ${senderName} no puede resistirse a pensar en cosas traviesas junto a ${targetName} 😳`,
      `😎 ${senderName} está en modo pajero total con ${targetName} 😈`,
      `🤣 ${senderName} tiene pensamientos muy traviesos sobre ${targetName} 😏`,
      `😅 ${senderName} confiesa que está haciendo cosas de pajero con ${targetName} 🤫`
    ]

    const frase = frases[Math.floor(Math.random() * frases.length)]

    // Construir mensaje con menciones solo si hay target real
    let mentions = []
    if (targetJid) mentions.push(targetJid)
    mentions.push(who) // siempre mencionar quien lo usa

    await conn.sendMessage(
      m.chat,
      { text: frase, mentions },
      { quoted: m }
    )

  } catch (e) {
    console.error(e)
    await conn.reply(m.chat, '✖️ Ocurrió un error al ejecutar el comando .pajin', m)
  }
}

handler.command = ['pajin', 'pajero']
handler.tags = ['fun', 'nsfw']
handler.help = ['pajin @usuario']
handler.group = true

export default handler
