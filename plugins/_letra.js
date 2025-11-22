import fetch from "node-fetch";

let handler = async (m, { conn, text }) => {
  try {
    if (!text) 
      return m.reply("🎵 *Usá el comando así:*\n`.letra <nombre de la canción>`");

    await m.react('🎼');

    // Buscar la letra
    const api = `https://api.lyrics.ovh/v1/${encodeURIComponent(text)}`;
    const res = await fetch(api);

    if (!res.ok) {
      await m.react('❌');
      return m.reply("❌ *No encontré la letra de esa canción.*\nIntentá con un nombre más específico.");
    }

    const json = await res.json();

    if (!json.lyrics) {
      await m.react('❌');
      return m.reply("❌ No pude obtener la letra.");
    }

    // Formato
    const mensaje = `🎤 *Letra de:* _${text}_\n\n${json.lyrics}`;

    m.reply(mensaje);

  } catch (e) {
    console.error(e);
    await m.react('⚠️');
    m.reply("⚠️ Ocurrió un error al obtener la letra.");
  }
};

handler.command = ['letra'];
handler.help = ['letra <canción>'];
handler.tags = ['music'];

export default handler; 
