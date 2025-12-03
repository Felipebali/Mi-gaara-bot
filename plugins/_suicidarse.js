// plugins/_suicidarse.js
// 🛑 PREVENCIÓN + MENSAJE DE APOYO + AUTOKICK
// .suicidarse → mensaje motivador + recurso + expulsión automática

const frases = [
  "💙 Tu vida vale más de lo que hoy estás sintiendo.",
  "🌤️ No estás solo/a, pedir ayuda es un acto de valentía.",
  "🫂 Incluso en los días más oscuros, tu vida importa.",
  "💪 Resistir también es una forma de ganar.",
  "🌱 Siempre hay algo nuevo que puede llegar.",
  "🧠 Lo que hoy pesa, mañana puede doler menos.",
  "❤️ No estás roto/a, estás luchando."
];

const handler = async (m, { conn, isBotAdmin }) => {
  // ✅ Solo en grupos
  if (!m.isGroup)
    return conn.reply(m.chat, '❗ Este comando solo funciona en grupos.', m);

  // ✅ Bot debe ser admin
  if (!isBotAdmin)
    return conn.reply(m.chat, '❗ Necesito ser *administrador* para poder actuar.', m);

  try {
    const user = m.sender;
    const frase = frases[Math.floor(Math.random() * frases.length)];

    // 💙 Mensaje de contención
    const mensaje = `
🛑 *@${user.split("@")[0]}*, este mensaje es importante:

${frase}

📞 *Uruguay – Líneas de ayuda:*
• *0800 0767* — Línea Vida (24h)
• *911* — Emergencias

Pedir ayuda no es debilidad. 💙
`.trim();

    await conn.sendMessage(m.chat, {
      text: mensaje,
      mentions: [user]
    });

    await conn.sendMessage(m.chat, { react: { text: '💙', key: m.key } });

    // ⏳ Espera 6 segundos
    await new Promise(resolve => setTimeout(resolve, 6000));

    // 🦵 Auto-kick
    await conn.groupParticipantsUpdate(m.chat, [user], 'remove');

  } catch (err) {
    console.error('Error en .suicidarse:', err);
  }
};

handler.help = ['suicidarse'];
handler.tags = ['prevencion'];
handler.command = ['suicidarse']; // ✅ DETECCIÓN CORRECTA
handler.group = true;

export default handler;
