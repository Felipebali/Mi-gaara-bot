/**
 * Plugin: Anti-Llamadas (Toggle)
 * .antillamada → Activa/desactiva el bloqueo automático
 */

export default {
  command: ["antillamada", "anticall"],
  owner: true,

  // ===============================
  // COMANDO TOGGLE (IGUAL AL TUYO)
  // ===============================
  run: async ({ conn, remoteJid }) => {
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
    if (config.enabled) {
      return await conn.sendText(
        remoteJid,
        "✅ *Anti-llamadas ACTIVADO*\n\nSe bloqueará automáticamente a quien llame."
      )
    } else {
      return await conn.sendText(
        remoteJid,
        "🔴 *Anti-llamadas DESACTIVADO*\n\nNo se bloqueará a quien llame."
      )
    }
  },

  // ===============================
  // EVENTO DE LLAMADAS (AGREGADO)
  // ===============================
  onCall: async ({ conn, call }) => {
    try {
      const anticall = global.db?.data?.settings?.anticall
      if (!anticall?.enabled) return

      const calls = Array.isArray(call) ? call : [call]

      for (const c of calls) {
        // Solo llamadas entrantes
        if (c.status !== 'offer') continue

        const from = c.from

        // Grupos: solo aviso (no se pueden bloquear)
        if (from.endsWith('@g.us')) {
          await conn.sendMessage(from, {
            text: '📵 *Llamadas grupales no permitidas*'
          })
          continue
        }

        // Aviso
        await conn.sendMessage(from, {
          text: '🚫 *Llamadas no permitidas*\n\nHas sido bloqueado automáticamente.'
        })

        // Rechazar llamada
        await conn.rejectCall(c.id, from)

        // Bloquear usuario
        await conn.updateBlockStatus(from, 'block')

        console.log(`📵 AntiCall → Bloqueado: ${from}`)
      }
    } catch (e) {
      console.error('❌ Error AntiCall:', e)
    }
  }
}
