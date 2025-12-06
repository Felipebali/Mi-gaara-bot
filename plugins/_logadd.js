// 📂 plugins/log-add-user.js
// ✅ LOG GLOBAL: QUIÉN AGREGA A QUIÉN
// ✅ Sistema por METADATA (igual que tu welcome)

let handler = async (m, { conn }) => {
  // Este handler no usa comandos
}

// --- BEFORE ---
handler.before = async function (m, { conn }) {
  try {
    if (!m.isGroup) return

    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
    let chat = global.db.data.chats[m.chat]

    // Si no existe la lista previa, la creamos
    if (!chat.logParticipants) {
      const meta = await conn.groupMetadata(m.chat)
      chat.logParticipants = meta.participants.map(p => p.id)
      return
    }

    // Metadata actual
    const meta = await conn.groupMetadata(m.chat)
    const current = meta.participants.map(p => p.id)
    const old = chat.logParticipants

    const added = current.filter(x => !old.includes(x))

    const groupName = meta.subject

    // Autor aproximado (igual que tu welcome)
    const autor = m.sender

    // ✅ LOG DE INGRESO
    for (let user of added) {
      const metodo = autor === user
        ? "🔗 Ingresó por enlace"
        : "➕ Fue agregado por un administrador"

      const fecha = new Date().toLocaleString("es-UY")

      let mensaje = `
📥 *NUEVO INGRESO AL GRUPO*
━━━━━━━━━━━━━━━━━━━━
👤 *Nuevo:* @${user.split("@")[0]}
🧑‍💼 *Agregado por:* @${autor.split("@")[0]}
🏷 *Grupo:* ${groupName}
🕒 *Fecha:* ${fecha}
📌 *Método:* ${metodo}
━━━━━━━━━━━━━━━━━━━━
`.trim()

      await conn.sendMessage(m.chat, {
        text: mensaje,
        mentions: [user, autor]
      })
    }

    // Actualizar lista
    chat.logParticipants = current

  } catch (e) {
    console.error("❌ LOG ADD ERROR:", e)
  }
}

// ✅ OBLIGATORIO PARA QUE EL LOADER LO LEA
handler.before = true
handler.group = true

export default handler
