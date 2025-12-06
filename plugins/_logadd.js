// 📂 plugins/log-add-user.js
// ✅ LOG: QUIÉN AGREGA A QUIÉN
// ✅ Compatible con Baileys MD

let handler = async (m, { conn, participants, action }) => {
  try {
    // Solo cuando alguien entra
    if (action !== 'add') return

    const chat = m.chat
    const groupMetadata = await conn.groupMetadata(chat)
    const grupo = groupMetadata.subject

    // Usuario que fue agregado
    const nuevo = participants[0]

    // El que lo agregó
    const autor = m.sender

    // Si entró solo por link, WhatsApp pone el mismo número
    let metodo = autor === nuevo
      ? "🔗 Ingresó por enlace"
      : "➕ Fue agregado por un administrador"

    const fecha = new Date().toLocaleString("es-UY")

    let mensaje = `
📥 *NUEVO INGRESO AL GRUPO*
━━━━━━━━━━━━━━━━━━━━
👤 *Nuevo:* @${nuevo.split("@")[0]}
🧑‍💼 *Agregado por:* @${autor.split("@")[0]}
🏷 *Grupo:* ${grupo}
🕒 *Fecha:* ${fecha}
📌 *Método:* ${metodo}
━━━━━━━━━━━━━━━━━━━━
`.trim()

    await conn.sendMessage(chat, {
      text: mensaje,
      mentions: [nuevo, autor]
    })

  } catch (e) {
    console.error("LOG ADD ERROR:", e)
  }
}

handler.group = true
handler.admin = false
handler.botAdmin = false

export default handler
