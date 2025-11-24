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

    // Enviar la imagen antes del menú
    await conn.sendMessage(m.chat, {
      image: { url: 'http://imgfz.com/i/8DJf5qF.jpeg' },
      caption: `🐾 *${botname}* te da la bienvenida!`
    }, { quoted: m });

    let menu = `
╭━━━ ✨ *CENTRO FELINO* ✨ ━━━╮
│ 😺 *${botname}* 😺
│ 👑 *Creador:* ${creador}
│ ⚙️ *Versión:* ${versionBot}
│ 💬 *${saludo}*
│ ⏰ *Hora actual:* ${fecha}
╰━━━━━━━━━━━━━━━━━━━━━━━╯

🌦️ *Consultas rápidas:*
┃ 🚨 *.reportar <motivo>* – Reporta algo indebido
┃ 🌍 *.clima <ciudad>* – Ver clima actual
┃ 🕐 *.hora* – Ver hora actual en el mundo
┃ 🌐 *.traducir <idioma> <texto>* – Traduce textos
┃ ✉️ *.sug* – Envía una sugerencia (1 cada 24h)
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━ 📚 *TIPOS DE MENÚ* ━━━┓
┃ 👤 *.menuser*
┃ 🎮 *.menuj*
┃ 💾 *.menudl*
┃ 👥 *.menugp*
┃ 🔥 *.menuhot*
┃ 👑 *.menuowner*
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━ 🛡️ *SEGURIDAD DEL GRUPO* ━━━┓
┃ 🔗 *.antilink*
┃ 🧩 *.antilink2*
┃ 🚫 *.antispam*
┃ 🤖 *.antibot*
┃ ☣️ *.antitoxico*
┃ 👻 *.antifake*
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━ 📥 *DESCARGAS* ━━━┓
┃ 📲 *.apk*
┃ 🎧 *.spotify*
┃ 📘 *.fb*
┃ 📸 *.ig*
┃ 📂 *.mediafire*
┃ 🎵 *.tiktok*
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━ 🎶 *MÚSICA / VIDEOS* ━━━┓
┃ 🎵 *.ytplay*
┃ 🎶 *.ytaudio*
┃ 🔊 *.ytmp3*
┃ 🎬 *.ytvideo*
┃ 🎥 *.ytplay2*
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━ 🔍 *BUSCADOR* ━━━┓
┃ 🖼️ *.imagen*
┃ 🌐 *.google*
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━ 🎮 *GAMES FELINOS* ━━━┓
┃ 🕹️ *.juegos*
┃ ❓ *.adivinanza*
┃ 🏴 *.bandera*
┃ 🏛️ *.capital*
┃ 🧠 *.pensar*
┃ 🔢 *.número*
┃ 🐈‍⬛ *.miau*
┃ 🏆 *.top10*
┃ 🍝 *.plato*
┃ 💃 *.dance*
┃ 🎯 *.trivia*
┃ 🧞 *.consejo*
┃ 📱 *.fakewpp*
┃ 💔 *.infiel*
┃ 🦊 *.zorro/a*
┃ 🤡 *.cornudo/a*
┃ 💋 *.kiss*
┃ 💞 *.puta*
┃ 🏳️‍🌈 *.trolo*
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━ 🧰 *ADMINS / STAFF* ━━━┓
┃ 🗑️ *.del*
┃ 👢 *.k*
┃ 🅿️ *.p*
┃ 🅳 *.d*
┃ 🔇 *.mute* / *.unmute*
┃ 🏷️ *.tagall*
┃ 📣 *.tag*
┃ 🧠 *.ht*
┃ ⚙️ *.g*
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━ 👑 *OWNERS* ━━━┓
┃ 🛡️ *.autoadmin*
┃ 🎯 *.chetar* / *.deschetar*
┃ 🕵️ *.detectar*
┃ 🔗 *.join*
┃ 📜 *.grouplist*
┃ 🔄 *.resetuser*
┃ ✏️ *.setprefix*
┃ 🧹 *.resetprefix*
┃ 🔁 *.restart*
┃ 💣 *.wipe*
┃ 🪄 *.resetlink*
┃ ⚙️ *.update*
┃ 👑 *.owner*
┗━━━━━━━━━━━━━━━━━━━━━┛

🐾 *${botname}* siempre vigilante 😼  
✨ _“Un maullido, una acción.”_

📢 **Canal oficial:**  
👉 https://whatsapp.com/channel/${encodeURIComponent("120363421977886516")}
`;

    // Enviar el menú
    await conn.reply(m.chat, menu.trim(), m);

    // Reacción
    await conn.sendMessage(m.chat, { react: { text: '🐾', key: m.key } });

  } catch (err) {
    console.error(err);
    await conn.reply(m.chat, `❌ Error al mostrar el menú\n${err}`, m);
  }
};

handler.help = ['menu', 'menú', 'allmenu'];
handler.tags = ['main'];
handler.command = ['menu', 'menú', 'allmenu'];

export default handler;

function getSaludoGatuno() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "🌅 Maullidos buenos días!";
  if (hour >= 12 && hour < 18) return "☀️ Maullidos buenas tardes!";
  return "🌙 Maullidos buenas noches!";
}
