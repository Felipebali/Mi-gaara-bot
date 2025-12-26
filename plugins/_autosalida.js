const delay = (ms) => new Promise(r => setTimeout(r, ms))

let plugin = m => m

plugin.before = async function (m, { conn, isBotAdmin }) {
  if (!m.isGroup) return
  if (isBotAdmin) return

  try {
    // Aviso solo si conn está disponible
    if (conn?.sendMessage) {
      await conn.sendMessage(m.chat, {
        text: "🚫 *El bot necesita ser administrador para funcionar correctamente.*\n\n👋 Saliendo del grupo..."
      })
      await delay(1200)
    }

    // Salir del grupo
    if (conn?.groupLeave) {
      await conn.groupLeave(m.chat)
    }

  } catch (e) {
    console.error('Auto-salida error:', e)
  }
}

export default plugin
