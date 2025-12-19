/**
 * Plugin: Anti-Llamadas (Toggle)
 * .antillamada → Activa/desactiva el bloqueo automático
 */

let handler = async (m, { conn }) => {
  // Inicializar config si no existe
  if (!global.db.data.settings) {
    global.db.data.settings = {}
  }
  if (!global.db.data.settings.anticall) {
    global.db.data.settings.anticall = { enabled: true }
  }

  // Toggle
  const config = global.db.data.settings.anticall
  config.enabled = !config.enabled

  // Guardar
  try {
    const { saveDB } = await import('../db.js')
    await saveDB()
  } catch (err) {
    console.error(`⚠️ Error guardando: ${err.message}`)
  }

  // Responder
  await conn.sendMessage(m.chat, {
    text: config.enabled
      ? "✅ *Anti-llamadas ACTIVADO*\n\nSe bloqueará automáticamente a quien llame."
      : "🔴 *Anti-llamadas DESACTIVADO*\n\nNo se bloqueará a quien llame."
  })
}

// ===============================
// EVENTO DE LLAMADAS
// ===============================
handler.before = async (m, { conn }) => {
  try {
    if (!m.message?.callLogMessage) return

    const anticall = global.db?.data?.settings?.anticall
    if (!anticall?.enabled) return

    const from = m.chat

    // Grupos: solo aviso
    if (from.endsWith('@g.us')) {
      await conn.sendMessage(from, {
        text: '📵 *Llamadas grupales no permitidas*'
      })
      return
    }

    // Aviso
    await conn.sendMessage(from, {
      text: '🚫 *Llamadas no permitidas*\n\nHas sido bloqueado automáticamente.'
    })

    // Bloquear
    await conn.updateBlockStatus(from, 'block')

    console.log(`📵 AntiCall → Bloqueado: ${from}`)
  } catch (e) {
    console.error('❌ Error AntiCall:', e)
  }
}

handler.command = ['antillamada', 'anticall']
handler.owner = true

export default handler
