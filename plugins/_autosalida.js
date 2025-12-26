const delay = (ms) => new Promise(r => setTimeout(r, ms))

let plugin = m => m

plugin.before = async function (m, { conn, isBotAdmin }) {
  if (!m.isGroup) return
  if (isBotAdmin) return

  try {
    // Espera mínima para evitar conflictos internos
    await delay(500)

    // Salida directa (sin intentar enviar mensajes)
    if (conn?.groupLeave) {
      await conn.groupLeave(m.chat)
    }

  } catch (e) {
    // Silencioso: no hace spam de errores
  }
}

export default plugin
