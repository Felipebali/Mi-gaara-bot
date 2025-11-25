// 📂 plugins/alerta.js — FelixCat_Bot 🐾
// Envía texto + audio citado (si existe) al grupo destino, con mención oculta

const handler = async (m, { conn, text, participants }) => {
  try {
    const destino = "120363420369650074@g.us"  // Grupo donde se enviará

    if (!text) text = "⚠️ Aviso importante para todos"

    // Crear lista de menciones ocultas
    const miembros = participants.map(u => u.id)

    // Enviar mensaje de texto al grupo
    await conn.sendMessage(destino, {
      text,
      mentions: miembros
    })

    // ─── ★ Audio citado ★ ───
    if (m.quoted) {
      const q = m.quoted
      const mime = q?.mimetype || q.msg?.mimetype || ""

      if (/audio/.test(mime)) {
        const audio = await q.download() // descarga el audio
        await conn.sendMessage(destino, {
          audio,
          mimetype: mime,
          ptt: mime.includes("opus") // si es nota de voz se mantiene como PTT
        })
      }
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
