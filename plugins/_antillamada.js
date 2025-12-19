/**
 * Plugin: Anti-Llamadas (Toggle)
 * .antillamada → Activa/desactiva el bloqueo automático
 */

let handler = async (m, { conn }) => {
  // Inicializar config si no existe
  if (!global.db.data.settings) global.db.data.settings = {}
  if (!global.db.data.settings.anticall) {
    global.db.data.settings.anticall = { enabled: true }
  }

  // Toggle
  const config = global.db.data.settings.anticall
  config.enabled = !config.enabled

  // Guardar DB
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

// ====================================
// EVENTO DE LLAMADAS (REAL FUNCIONAL)
// ====================================

handler.all = async function (m, { conn }) {
  // Este bloque se ejecuta una vez, cuando se carga el plugin
  if (this._antiCallLoaded) return
  this._antiCallLoaded = true

  conn.ev.on('call', async (calls) => {
    try {
      const anticall = global.db?.data?.settings?.anticall
      if (!anticall?.enabled) return

      for (const c of calls) {
        // Solo llamadas entrantes
        if (c.status !== 'offer') continue

        const from = c.from
        const isGroup = from.endsWith('@g.us')

        // Llamadas grupales: solo aviso
        if (isGroup) {
          await conn.sendMessage(from, {
            text: '📵 *Llamadas grupales no permitidas*'
          })
          continue
        }

        // Aviso al usuario
        await conn.sendMessage(from, {
          text: '🚫 *Llamadas no permitidas*\n\nHas sido bloqueado automáticamente.'
        })

        // Rechazar la llamada
        await conn.rejectCall(c.id, from)

        // Bloquear el contacto
        await conn.updateBlockStatus(from, 'block')

        console.log(`📵 AntiCall → Usuario bloqueado: ${from}`)
      }
    } catch (e) {
      console.error('❌ Error en evento AntiCall:', e)
    }
  })
}

handler.command = ['antillamada', 'anticall']
handler.owner = true

export default handler
