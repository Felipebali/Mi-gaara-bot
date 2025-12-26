const delay = ms => new Promise(r => setTimeout(r, ms))

// evitar crear muchos timers por grupo
const leavingTimers = new Map()

let plugin = m => m

plugin.before = async function (m, { conn, isBotAdmin }) {
  if (!m.isGroup) return
  if (isBotAdmin) return

  // si ya está programada la salida para este grupo, no repetir
  if (leavingTimers.has(m.chat)) return

  leavingTimers.set(m.chat, true)

  try {
    // intentar avisar (si WhatsApp lo permite)
    try {
      await conn.sendMessage(m.chat, {
        text: '⚠️ *El bot ya no es administrador.*\n\n⏳ Me retiraré del grupo en 2 minutos si no me devuelven admin.'
      })
    } catch {}

    // esperar 2 minutos
    await delay(120000)

    // salir del grupo
    if (conn?.groupLeave) {
      await conn.groupLeave(m.chat)
    }

  } catch {}

  leavingTimers.delete(m.chat)
}

export default plugin
