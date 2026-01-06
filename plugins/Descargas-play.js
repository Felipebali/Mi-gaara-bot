import yts from "yt-search"
import ytdl from "ytdl-core"
import fetch from "node-fetch"

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text?.trim())
    return conn.reply(m.chat, `⚠️ Ingresa el nombre o enlace del video.`, m);

  await m.react('🔎');

  // Buscar video en YouTube
  const videoMatch = text.match(/(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|shorts\/|v\/)?([a-zA-Z0-9_-]{11})/);
  const query = videoMatch ? `https://youtu.be/${videoMatch[1]}` : text;
  const search = await yts(query);
  const result = videoMatch
    ? search.videos.find(v => v.videoId === videoMatch[1]) || search.videos[0]
    : search.videos[0];

  if (!result) return conn.reply(m.chat, "❌ No se encontraron resultados.", m);

  const { title, thumbnail, timestamp, views, ago, url, author } = result;
  const vistas = formatViews(views);

  const thumb = Buffer.from(await (await fetch("https://files.catbox.moe/wfd0ze.jpg")).arrayBuffer());
  const fkontak = { key: { fromMe: false, participant: "0@s.whatsapp.net" }, message: { documentMessage: { title: `「 ${title} 」`, fileName: global.botname || "Bot", jpegThumbnail: thumb } } };

  const info = `🎬 *${title}*
📺 *Canal:* ${author.name || "Desconocido"}
👀 *Vistas:* ${vistas}
⏱️ *Duración:* ${timestamp || 'N/A'}
📅 *Publicado:* ${ago || 'N/A'}
🔗 *Link:* ${url}`;

  await conn.sendMessage(m.chat, { image: { url: thumbnail }, caption: info }, { quoted: fkontak });

  try {
    if (['play', 'mp3'].includes(command)) {
      await m.react('🎧');
      const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });
      await conn.sendMessage(m.chat, { audio: stream, mimetype: 'audio/mpeg', fileName: `${title}.mp3` }, { quoted: fkontak });
      await m.react('✔️');
    }
    else if (['play2', 'mp4'].includes(command)) {
      await m.react('🎬');
      const stream = ytdl(url, { quality: 'highestvideo' });
      await conn.sendMessage(m.chat, { video: stream, mimetype: 'video/mp4', fileName: `${title}.mp4`, caption: `🎥 ${title}` }, { quoted: fkontak });
      await m.react('✔️');
    }
  } catch (e) {
    await m.react('✖️');
    console.error(e);
    conn.reply(m.chat, `⚠️ Error: ${e?.message || e}`, m);
  }
};

handler.command = handler.help = ['play', 'play2', 'mp3', 'mp4'];
handler.tags = ['download'];
export default handler;

function formatViews(v) {
  if (!v) return "N/A";
  if (v >= 1e9) return (v / 1e9).toFixed(1) + "B";
  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return v.toString();
}
