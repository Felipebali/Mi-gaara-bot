// 📂 plugins/_suicidarse.js
// PREVENCIÓN + MENSAJE DE APOYO + AUTOKICK
// .suicidarse → frase motivadora + recurso + expulsión automática

const frases = [
  "💙 Tu vida vale más de lo que hoy estás sintiendo.",
  "🌤️ No estás solo/a. Pedir ayuda es valentía.",
  "🫂 Incluso en los días más oscuros, tu vida importa.",
  "💪 Resistir también es una forma de ganar.",
  "🌱 Siempre hay algo nuevo que puede llegar."
];

let handler = async (m, { conn, isBotAdmin }) => {

  // ✅ SOLO EN GRUPOS
  if (!m.isGroup) return m.reply("❌ Este comando solo funciona en grupos.");

  // ✅ BOT DEBE SER ADMIN
  if (!isBotAdmin)
    return m.reply("⚠️ Necesito ser administrador para aplicar el auto-kick.");

  try {
    const user = m.sender;
    const frase = frases[Math.floor(Math.random() * frases.length)];

    const mensaje = 
`🛑 *@${user.split("@")[0]}*, este mensaje es importante:

${frase}

📞 *Uruguay - Líneas de ayuda:*
• *0800 0767* — Línea Vida (24h)
• *911* — Emergencias

Pedir ayuda no es debilidad. 💙`;

    // ✅ MENSAJE DE APOYO
    await conn.sendMessage(m.chat, {
      text: mensaje,
      mentions: [user]
    });

    // ✅ AUTOKICK A LOS 6s
    setTimeout(async () => {
      try {
        await conn.groupParticipantsUpdate(m.chat, [user], "remove");
      } catch (e) {}
    }, 6000);

  } catch (e) {
    console.error("Error suicidarse:", e);
  }
};

// ✅ ASÍ TU BOT SÍ LO RECONOCE
handler.command = ["suicidarse"];
handler.group = true;

export default handler;
