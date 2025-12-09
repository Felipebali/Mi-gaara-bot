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
┃ 🔮 *.horoscopo <signo>*
┃ 🚨 *.reportar <motivo>*
┃ 🌍 *.clima <ciudad>*
┃ 🕐 *.hora*
┃ 🌐 *.traducir <idioma> <texto>*
┃ ✉️ *.sug*
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

┏━━━ 🎬 *ENTRETENIMIENTO* ━━━┓
┃ 🎥 *.quever <género>*
┃ 📺 *.verserie <género>*
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━ 🎶 *MÚSICA / VIDEOS* ━━━┓
┃ 🎵 *.play*
┃ 🎶 *.audio*
┃ 🔊 *.mp3*
┃ 🎬 *.video*
┃ 🎥 *.play2*
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━ 🖼️ *STICKERS & MULTIMEDIA* ━━━┓
┃ 💬 *.qc <texto>*
┃ ✂️ *.s*
┃ 🖼️ *.imagen*
┃ 🌐 *.google*
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━ 🎮 *GAMES FELINOS* ━━━┓
┃ ❓ *.adivinanza*
┃ 🏴 *.bandera*
┃ 🏛️ *.capital*
┃ 🧠 *.pensar*
┃ 🔢 *.numero*
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
`.trim();

    // ========== BOTONES 100% COMPATIBLES ==========
    await conn.sendMessage(m.chat, {
      text: menu,
      footer: '🐾 FelixCat-Bot ❤️',
      buttons: [
        {
          buttonId: ".menuser",
          buttonText: { displayText: "👤 Menú Usuario" },
          type: 1
        },
        {
          buttonId: ".menuj",
          buttonText: { displayText: "🎮 Juegos" },
          type: 1
        },
        {
          type: 4,
          nativeFlowInfo: {
            name: "cta_url",
            paramsJson: JSON.stringify({
              display_text: "👑 Owner (Instagram)",
              url: "https://www.instagram.com/feli_dipe?igsh=MW8yOXQ5cDllejV0Ng==",
              merchant_url: "https://www.instagram.com/feli_dipe?igsh=MW8yOXQ5cDllejV0Ng=="
            })
          }
        }
      ]
    }, { quoted: m });

  } catch (err) {
    console.error(err);
    await conn.reply(m.chat, `❌ Error al mostrar menú\n${err}`, m);
  }
};

handler.help = ['menu'];
handler.tags = ['main'];
handler.command = ['menu', 'menú', 'allmenu'];

export default handler;

function getSaludoGatuno() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "🌅 Maullidos buenos días!";
  if (hour >= 12 && hour < 18) return "☀️ Maullidos buenas tardes!";
  return "🌙 Maullidos buenas noches!";
}
