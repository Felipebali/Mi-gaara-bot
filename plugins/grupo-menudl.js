let handler = async (m, { conn }) => {
    const mensaje = `
╭━━〔 ⚡ *FelixCat-Bot* ⚡ 〕━━⬣
┃ ✨ *YouTube Mejorado*
┃
┃ • .ytplay
┃ • .ytaudio
┃ • .ytvideo
┃ • .ytplay2
┃
┃ 📥 *Menú de Descargas*
┃
┃ • .facebook
┃ • .ig
┃ • .tiktok
┃ • .tiktoksearch
┃ • .spotify
┃ • .ytmp3
┃ • .ytmp4
┃ • .mediafire
┃ • .apk2
╰━━━━━━━━━━━━━━━━⬣
`.trim();

    await conn.sendMessage(m.chat, { text: mensaje }, { quoted: m });
};

handler.command = ['menudl'];
handler.help = ['menudl'];
handler.tags = ['descargas'];
handler.group = false;

export default handler;
