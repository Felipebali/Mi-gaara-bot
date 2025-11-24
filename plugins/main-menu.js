// plugins/menu.js
const botname = global.botname || '😸 FelixCat-Bot 😸';
const creador = 'Balkoszky🇵🇱';
const versionBot = '10.6.1';

let handler = async (m, { conn }) => {
  try {
    const saludo = getSaludoGatuno();
    const fecha = new Date().toLocaleString('es-UY', {
      timeZone: 'America/Montevideo',
      hour12: false
    });

    let menu = `
╭━━━ ✨ *CENTRO FELINO* ✨ ━━━╮
│ 😺 *${botname}* 😺
│ 👑 *Creador:* ${creador}
│ ⚙️ *Versión:* ${versionBot}
│ 💬 *${saludo}*
│ ⏰ *Hora actual:* ${fecha}
╰━━━━━━━━━━━━━━━━━━━━━━━╯

🌦️ *Consultas rápidas:*
┃ 🚨 *.reportar <motivo>*
┃ 🌍 *.clima <ciudad>*
┃ 🕐 *.hora*
┃ 🌐 *.traducir <idioma> <texto>*
┃ ✉️ *.sug*
┗━━━━━━━━━━━━━━━━━━━━━┛

✨ _“Un maullido, una acción.”_
`;

    // ⚠️ BOTONES NUEVO FORMATO (FUNCIONA 2024/2025)
    const msg = {
      image: { url: "http://imgfz.com/i/8DJf5qF.jpeg" },
      caption: menu,
      buttons: [
        {
          buttonId: "canal",
          buttonText: { displayText: "📢 VER CANAL" },
          type: 1
        }
      ],
      headerType: 4
    };

    await conn.sendMessage(m.chat, msg, { quoted: m });

    // Respuesta cuando presionan el botón
    conn.ev.on("messages.upsert", async ({ messages }) => {
      let ms = messages[0];
      if (!ms.message?.buttonsResponseMessage) return;

      if (ms.message.buttonsResponseMessage.selectedButtonId === "canal") {
        await conn.sendMessage(
          ms.key.remoteJid,
          { text: "📢 Canal oficial:\nhttps://whatsapp.com/channel/120363421977886516" }
        );
      }
    });

    // Reacción
    await conn.sendMessage(m.chat, { react: { text: '🐾', key: m.key } });

  } catch (err) {
    console.error(err);
    await conn.reply(m.chat, `❌ Error al mostrar el menú\n${err}`);
  }
};

handler.help = ["menu"];
handler.tags = ["main"];
handler.command = ["menu", "menú", "allmenu"];

export default handler;

function getSaludoGatuno() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "🌅 Maullidos buenos días!";
  if (hour >= 12 && hour < 18) return "☀️ Maullidos buenas tardes!";
  return "🌙 Maullidos buenas noches!";
}
