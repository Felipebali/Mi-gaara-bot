// 📂 plugins/hora.js

// 🕒 Cooldown por usuario
const cooldowns = new Map()

const ZONAS = {
  uruguay: 'America/Montevideo',
  argentina: 'America/Argentina/Buenos_Aires',
  chile: 'America/Santiago',
  brasil: 'America/Sao_Paulo',
  mexico: 'America/Mexico_City',
  españa: 'Europe/Madrid',
  madrid: 'Europe/Madrid',
  montevideo: 'America/Montevideo',
  buenosaires: 'America/Argentina/Buenos_Aires'
}

let handler = async (m, { conn, text }) => {
  try {
    const userId = m.sender
    const now = Date.now()
    const cooldownTime = 3 * 60 * 60 * 1000

    if (cooldowns.has(userId)) {
      const diff = now - cooldowns.get(userId)
      if (diff < cooldownTime) {
        const r = cooldownTime - diff
        const h = Math.floor(r / 3600000)
        const min = Math.floor((r % 3600000) / 60000)
        return conn.reply(
          m.chat,
          `🕒 *@${userId.split('@')[0]}*\nEsperá *${h}h ${min}min* para volver a usarlo.`,
          m,
          { mentions: [userId] }
        )
      }
    }

    cooldowns.set(userId, now)
    await m.react('🕒')

    let lugar = text?.toLowerCase().replace(/\s+/g, '') || 'uruguay'
    let zona = ZONAS[lugar] || 'America/Montevideo'

    const ahora = new Date()
    const horaNum = Number(
      new Intl.DateTimeFormat('es-UY', {
        hour: '2-digit',
        hour12: false,
        timeZone: zona
      }).format(ahora)
    )

    let emoji = '🌙'
    if (horaNum >= 6 && horaNum < 12) emoji = '🌅'
    else if (horaNum >= 12 && horaNum < 19) emoji = '🌞'
    else if (horaNum >= 19 && horaNum < 23) emoji = '🌆'

    const fecha = new Intl.DateTimeFormat('es-UY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: zona
    }).format(ahora)

    const hora = new Intl.DateTimeFormat('es-UY', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: zona
    }).format(ahora)

    const msg = `
${emoji} *Hora actual (${zona}):*

📅 *${fecha.charAt(0).toUpperCase() + fecha.slice(1)}*
⏰ *${hora}*
    `.trim()

    await conn.reply(m.chat, msg, m)
    await m.react('✅')

  } catch (e) {
    console.error(e)
    await m.react('⚠️')
    await conn.reply(m.chat, '⚠️ Error al obtener la hora.', m)
  }
}

handler.help = ['hora <país/ciudad>']
handler.tags = ['utilidad']
handler.command = ['hora', 'time', 'tiempo']
export default handler
