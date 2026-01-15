// plugins/tagallT.js
// Activador: letra "T" o "t" (sin prefijo)
// SOLO ROOT OWNERS pueden activarlo
// Mención visible a un usuario al azar + mención oculta al resto

let handler = async (m, { conn, groupMetadata }) => {
  try {
    if (!m.isGroup) return

    // 🔐 Solo dueños reales (desde config.js)
    if (!m.isROwner) return

    const texto = (m.text || '').trim()
    if (texto.toLowerCase() !== 't') return

    const participantes = (groupMetadata?.participants || [])
      .map(p => (conn.decodeJid ? conn.decodeJid(p.id) : p.id))
      .filter(Boolean)

    if (participantes.length < 2) return

    const usuarioAzar = participantes[Math.floor(Math.random() * participantes.length)]
    const mencionesOcultas = participantes.filter(u => u !== usuarioAzar)

    const frases = [
      `📢 Parece que @${usuarioAzar.split('@')[0]} quiso asegurarse de que nadie se quede dormido 😴`,
      `👀 @${usuarioAzar.split('@')[0]} tocó la letra mágica... y ahora todos fueron notificados 💬`,
      `💡 @${usuarioAzar.split('@')[0]} pensó que sería buena idea avisar a todos 😅`,
      `⚡ @${usuarioAzar.split('@')[0]} activó el modo “presente o expulsado” 😆`,
      `🔥 @${usuarioAzar.split('@')[0]} encendió el grupo con una sola letra 😎`,
      `😂 Todo indica que @${usuarioAzar.split('@')[0]} tenía ganas de charlar con todos 📲`,
    ]

    const mensaje = frases[Math.floor(Math.random() * frases.length)]

    await conn.sendMessage(m.chat, {
      text: mensaje,
      mentions: [usuarioAzar, ...mencionesOcultas]
    })

  } catch {}
}

// Detecta "T" o "t" sin prefijo
handler.customPrefix = /^\s*t\s*$/i
handler.command = new RegExp()
handler.group = true

export default handler
