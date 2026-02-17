// 📂 plugins/owner.js — FelixCat 🐾
// Comando .owner que usa SOLO global.owner

let handler = async (m, { conn }) => {

  if (!global.owner || !global.owner.length) {
    return m.reply("❌ No hay owners configurados en global.owner");
  }

  let texto = `👑 *OWNERS DEL BOT* 👑\n\n`;
  let mentions = [];

  global.owner.forEach((data, i) => {

    let numero = Array.isArray(data) ? data[0] : data;

    // Solo números reales (no LID)
    if (!numero.includes('@')) {
      let jid = numero + '@s.whatsapp.net';
      mentions.push(jid);

      texto += `➤ Owner ${i + 1}: @${numero}\n`;
    }

  });

  texto += `\n🤖 FelixCat Bot`;

  await conn.sendMessage(m.chat, {
    text: texto,
    mentions
  }, { quoted: m });

};

handler.help = ['owner'];
handler.tags = ['info'];
handler.command = ['owner'];

export default handler;
