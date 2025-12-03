// ⚠️ COMANDO SENSIBLE — Prevención + Motivación + AutoKick
// .sucidarse → mensaje de apoyo + auto kick seguro

let handler = async (m, { conn }) => {

  if (!m.isGroup)
    return conn.reply(m.chat, '⚠️ Este comando solo funciona en grupos.', m)

  const numero = m.sender.split('@')[0]

  const frases = [
    '💛 Tu vida vale más de lo que imaginás.',
    '🌤️ Esto también va a pasar, no estás solo.',
    '🫂 Pedir ayuda también es una forma de ser fuerte.',
    '✨ Todavía quedan cosas lindas por vivir.',
    '🧠 Tu mente importa, cuidarla también es valentía.',
    '🤍 Aunque hoy duela, mañana puede doler menos.',
    '🔥 Sos más fuerte de lo que pensás.'
  ]

  const frase = frases[Math.floor(Math.random() * frases.length)]

  const texto = `
🛑 *@${numero}*
No estás solo/a.
${frase}

Si estás pasando un mal momento, hablá con alguien de confianza.
Tu vida importa más de lo que creés. 🤍
`.trim()

  await conn.sendMessage(m.chat, {
    text: texto,
    mentions: [m.sender]
  })

  await conn.sendMessage(m.chat, { react: { text: '🤍', key: m.key } })

  await new Promise(resolve => setTimeout(resolve, 3000))
  await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
}

// ✅ ASÍ LO RECONOCE TU LOADER
handler.help = ['sucidarse']
handler.tags = ['seguridad']
handler.command = /^sucidarse$/i
handler.group = true
handler.botAdmin = true

export default handler
