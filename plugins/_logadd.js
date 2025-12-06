// 📂 plugins/welcome.js
// ✅ Welcome + Leave + LOG quién agrega a quién (FINAL FUNCIONAL)

let handler = async (m, { conn, isAdmin }) => {
  if (!m.isGroup)
    return conn.sendMessage(m.chat, { text: "❌ Solo funciona en grupos." })

  if (!isAdmin)
    return conn.sendMessage(m.chat, { text: "⚠️ Solo los administradores pueden usar este comando." })

  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}

  let chat = global.db.data.chats[m.chat]
  chat.welcome = !chat.welcome

  await conn.sendMessage(m.chat, {
    text: `✨ *Welcome ${chat.welcome ? "ACTIVADO" : "DESACTIVADO"}*`
  })
}

// --- BEFORE ---
handler.before = async function (m, { conn }) {
  try {
    if (!m.isGroup) return

    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
    let chat = global.db.data.chats[m.chat]

    if (!chat.welcome) return

    // ✅ Inicializar lista
    if (!chat.participants) {
      const meta = await conn.groupMetadata(m.chat)
      chat.participants = meta.participants.map(p => p.id)
      return
    }

    const meta = await conn.groupMetadata(m.chat)
    const current = meta.participants.map(p => p.id)
    const old = chat.participants

    const added = current.filter(x => !old.includes(x))
    const removed = old.filter(x => !current.includes(x))
    const groupName = meta.subject

    const autor = m.sender || null
    const fecha = new Date().toLocaleString("es-UY")

    // ✅ BIENVENIDA + LOG
    for (let user of added) {
      const metodo = autor && autor !== user
        ? "➕ Fue agregado por un administrador"
        : "🔗 Ingresó por enlace"

      // 🎉 Welcome
      await conn.sendMessage(m.chat, {
        text: `🎉 ¡Bienvenido/a *@${user.split("@")[0]}* al grupo *${groupName}*!`,
        mentions: [user]
      })

      // 📥 LOG
      let log = `
📥 *NUEVO INGRESO AL GRUPO*
━━━━━━━━━━━━━━━━━━━━
👤 *Nuevo:* @${user.split("@")[0]}
🧑‍💼 *Agregado por:* ${autor ? `@${autor.split("@")[0]}` : "Desconocido"}
🏷 *Grupo:* ${groupName}
🕒 *Fecha:* ${fecha}
📌 *Método:* ${metodo}
━━━━━━━━━━━━━━━━━━━━
`.trim()

      await conn.sendMessage(m.chat, {
        text: log,
        mentions: autor ? [user, autor] : [user]
      })
    }

    // 👋 DESPEDIDA
    for (let user of removed) {
      await conn.sendMessage(m.chat, {
        text: `👋 *@${user.split("@")[0]}* salió del grupo *${groupName}*.`,
        mentions: [user]
      })
    }

    chat.participants = current

  } catch (e) {
    console.error("❌ WELCOME/LOG ERROR:", e)
  }
}

handler.command = ["welcome", "welc", "wl"]
handler.group = true
handler.admin = true

export default handler
