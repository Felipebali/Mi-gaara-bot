// 📂 plugins/log-add-user.js
// ✅ LOG: QUIÉN AGREGA A QUIÉN
// ✅ Compatible con Baileys MD (loader moderno)

let handler = async () => {}

handler.participantsUpdate = async (m, { conn }) => {
  try {
    const { id, participants, action, author } = m

    // ✅ Solo cuando alguien entra
    if (action !== 'add') return

    const chat = id
    const nuevo = participants[0]
    const autor = author || nuevo // si viene por link, author no existe

    const groupMetadata = await conn.groupMetadata(chat)
    const grupo = groupMetadata.subject

    // ✅ Detectar método real
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
    console.error("❌ LOG ADD ERROR:", e)
  }
}

export default handler
