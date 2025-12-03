// 📂 plugins/_suicidarse.js
// PREVENCIÓN + MENSAJE DE APOYO + AUTOKICK
// .suicidarse → envía frase motivadora + recurso de ayuda + expulsa al usuario

const frases = [
  "💙 Tu vida vale más de lo que hoy estás sintiendo. Esto también pasará.",
  "🌤️ No estás solo/a. Pedir ayuda es un acto de valentía.",
  "🫂 Incluso en los días más oscuros, tu vida sigue teniendo valor.",
  "💪 Hoy puede doler, pero mañana puede sorprenderte. Resistir también es ganar.",
  "🌱 Aún queda mucho por vivir, sentir, reír y descubrir."
];

let handler = async (m, { conn, isBotAdmin }) => {

  // Solo en grupos
  if (!m.isGroup) return;

  // El bot debe ser admin para poder expulsar
  if (!isBotAdmin) {
    return m.reply("⚠️ Necesito ser *administrador* para aplicar el autokick.");
  }

  try {
    const user = m.sender;
    const frase = frases[Math.floor(Math.random() * frases.length)];

    // 🛟 Mensaje de apoyo + recursos reales (Uruguay)
    const mensaje =
`🛑 *@${user.split("@")[0]}*, este mensaje es importante:

${frase}

📞 *Líneas de ayuda (Uruguay):*
• *0800 0767* — Línea Vida (24h)
• *911* — Emergencias

Hablar con alguien puede salvar una vida. Pedir ayuda está bien. 💙`;

    await conn.sendMessage(m.chat, {
      text: mensaje,
      mentions: [user]
    });

    // ⏳ Esperar 6 segundos antes de expulsar
    setTimeout(async () => {
      try {
        await conn.groupParticipantsUpdate(m.chat, [user], "remove");
      } catch (e) {}
    }, 6000);

  } catch (e) {
    // silencioso
  }
};

handler.command = ["suicidarse"];
handler.group = true;

export default handler;
