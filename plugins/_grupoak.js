// 📂 plugins/alerta.js — FelixCat_Bot 🐾
// Envía texto + audio citado (si existe) al grupo destino, con mención oculta

const handler = async (m, { conn, text, participants }) => {
  try {
    const destino = "120363420369650074@g.us"  // Grupo donde se enviará

    if (!text) text = "⚠️ Aviso importante para todos"

    // Crear lista de menciones
    const miembros = participants.map(u => u.id)

    // Primero envía el texto
    await conn.sendMessage(destino, {
      text,
      mentions: miembros
    })

    // Si el usuario citó un audio, reenviarlo
    if (m.quoted && m.quoted.mtype === "audioMessage") {
      await conn.forwardMessage(destino, m.quoted)
    }

    await m.reply("📩 *Mensaje enviado al grupo vinculado.*")

  } catch (e) {
    console.log("Error en alerta:", e)
    await m.reply("❌ Ocurrió un error al enviar el mensaje.")
  }
}

handler.command = ["alerta", "aviso", "spamgrup"]
handler.group = true

export default handler
