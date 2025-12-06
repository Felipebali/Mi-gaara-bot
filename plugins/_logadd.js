// 📂 plugins/welcome.js
// ✅ Welcome + Leave + LOG con detección REAL de quién agrega

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

    // ✅ AUTOR REAL SI EXISTE (stub del sistema)
    let autorReal = null
    if (m.messageStubType === 27 && m.messageStubParameters?.length) {
      autorReal = m.sender
    }

    const fecha = new Date().toLocaleString("es-UY")

    // ✅ BIENVENIDA + LOG REAL
    for (let user of added) {
      let metodo = "❓ Desconocido"
      let agregadoPor = "Desconocido"

      if (autorReal && autorReal !== user) {
        metodo = "➕ Agregado por usuario"
        agregadoPor = `@${autorReal.split("@")[0]}`
      } else {
        metodo = "🔗 Ingresó por enlace"
        agregadoPor = "Ingresó solo"
      }

      // 🎉 Welcome
      await conn.sendMessage(m.chat, {
        text: `🎉 ¡Bienvenido/a *@${user.split("@")[0]}* al grupo *${groupName}*!`,
        mentions: [user]
      })

      // 📥 LOG REAL
      let log = `
📥 *NUEVO INGRESO AL GRUPO*
━━━━━━━━━━━━━━━━━━━━
👤 *Nuevo:* @${user.split("@")[0]}
🧑‍💼 *Agregado por:* ${agregadoPor}
🏷 *Grupo:* ${groupName}
🕒 *Fecha:* ${fecha}
📌 *Método:* ${metodo}
━━━━━━━━━━━━━━━━━━━━
`.trim()

      let mentions = autorReal && autorReal !== user
        ? [user, autorReal]
        : [user]

      await conn.sendMessage(m.chat, {
        text: log,
        mentions
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
