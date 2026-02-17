// 📂 plugins/owner.js — FelixCat 🐾
// Muestra la lista de owners del bot

let handler = async (m, { conn }) => {

  if (!global.owner || !global.owner.length) {
    return m.reply("❌ No hay owners configurados.");
  }

  // Filtrar solo números reales (no LID)
  const owners = global.owner
    .map(v => Array.isArray(v) ? v[0] : v)
    .filter(num => /^\d+$/.test(num)); // solo números

  if (!owners.length) {
    return m.reply("❌ No se encontraron números válidos.");
  }

  const mentions = owners.map(n => n + '@s.whatsapp.net');

  let texto = `👑 *OWNERS DEL BOT* 👑\n\n`;

  owners.forEach((num, i) => {
    texto += `➤ Owner ${i + 1}: @${num}\n`;
  });

  texto += `\n🤖 FelixCat Bot`;

  await conn.sendMessage(m.chat, {
    text: texto,
    mentions
  }, { quoted: m });

};

handler.help = ['owner'];
handler.tags = ['info'];
handler.command = ['owner', 'dueños', 'creador'];

export default handler;
