// 📂 plugins/log-add-user.js
// ✅ LOG GLOBAL: QUIÉN AGREGA A QUIÉN
// ✅ Compatible con loaders que usan GROUP_PARTICIPANT_ADD

let handler = async (m, { conn }) => {
  try {
    // ✅ Filtrar solo eventos de entrada
    if (!m.messageStubType || m.messageStubType !== 27) return 
    // 27 = GROUP_PARTICIPANT_ADD

    const chat = m.chat
    const nuevo = m.messageStubParameters?.[0]

    if (!nuevo) return

    const autor = m.sender || nuevo

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

// ⚠️ ESTO ES OBLIGATORIO PARA QUE EL LOADER LO LEA
handler.before = true
handler.group = true

export default handler
