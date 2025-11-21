// 📂 plugins/auto_insta.js — FelixCat_Bot 🐾
// Promociona IG automáticamente cuando alguien manda un link,
// pero solo 1 vez cada 10 horas por usuario.

let handler = async (m, { conn }) => {
  const texto = m.text || ""
  
  // Detectar link de Instagram
  const regexIG = /https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._%-]+/i
  const match = texto.match(regexIG)

  if (!match) return // si no es link de IG, ignorar

  const user = m.sender
  const link = match[0]

  // Asegurar base de datos
  global.db.data.users[user] = global.db.data.users[user] || {}

  const lastUse = global.db.data.users[user].autoIG_last || 0
  const now = Date.now()
  const cooldown = 10 * 60 * 60 * 1000 // 10 horas

  // Si está en cooldown → reaccionar solamente
  if (now - lastUse < cooldown) {
    return conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
  }

  // Guardar nuevo tiempo
  global.db.data.users[user].autoIG_last = now

  // Mensaje de promoción
  const mensajePromo = `
📸 *¡Nueva promoción de Instagram!*  
👤 Usuario: @${user.split("@")[0]}
🔗 Enlace: ${link}

🔥 ¡Vayan a seguirlo!
`

  await conn.sendMessage(m.chat, { text: mensajePromo })
}

handler.customPrefix = /https?:\/\/(www\.)?instagram\.com\//i
handler.command = new RegExp // ← necesario para customPrefix sin prefijo
handler.tags = ['promo']
export default handler 
