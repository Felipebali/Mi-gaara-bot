// 📂 plugins/alerta.js — FelixCat_Bot 🐾
// Envía un mensaje a un grupo específico con mención oculta a todos

const handler = async (m, { conn, text, participants }) => {
  try {
    const destino = "120363420369650074@g.us"  // Grupo donde se enviará

    if (!text) text = "⚠️ Aviso importante para todos"

    // Crear lista de menciones ocultas
    const miembros = participants.map(u => u.id)
    
    await conn.sendMessage(destino, {
      text,
      mentions: miembros  // mención oculta a todos
    })

    await m.reply("📩 *Mensaje enviado al grupo vinculado.*")

  } catch (e) {
    console.log("Error en alerta:", e)
    await m.reply("❌ Ocurrió un error al enviar el mensaje.")
  }
}

handler.command = ["alerta", "aviso", "spamgrup"]
handler.group = true

export default handler 
