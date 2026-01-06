import yts from "yt-search";
import fetch from "node-fetch";
import crypto from "crypto";
import axios from "axios";

const cooldowns = {};
const COOLDOWN_TIME = 2 * 60 * 1000;
const MAX_WARNS = 3;

// ============================
// Palabras prohibidas
// ============================
const forbiddenArtists = [
  "roa", "peke77", "callejero fino", "anuel",
  "l gante", "hades", "bad bunny"
];

// ============================
// Base de datos de usuarios
// ============================
global.db = global.db || {};
global.db.users = global.db.users || {};

const handler = async (m, { conn, text, command }) => {
  const user = m.sender;
  const chatId = m.chat;
  const now = Date.now();

  if (text?.toLowerCase()) {
    const lowerText = text.toLowerCase();
    for (let word of forbiddenArtists) {
      if (lowerText.includes(word)) {
        await m.react('🤢');
        return conn.reply(chatId, `⚠️ No se permite reproducir contenido de "${word}".`, m);
      }
    }
  }

  if (cooldowns[user] && now - cooldowns[user] < COOLDOWN_TIME) {
    global.db.users[user] = global.db.users[user] || {};
    global.db.users[user].warns = (global.db.users[user].warns || 0) + 1;

    const warns = global.db.users[user].warns;

    if (warns >= MAX_WARNS) {
      try {
        await conn.groupParticipantsUpdate(chatId, [user], "remove");
        delete global.db.users[user].warns;
        delete cooldowns[user];
        return conn.reply(chatId, `⚠️ Usuario ${user.split("@")[0]} expulsado automáticamente por exceder ${MAX_WARNS} advertencias.`, m);
      } catch (e) {
        console.error(e);
      }
    }

    const remaining = Math.ceil((COOLDOWN_TIME - (now - cooldowns[user])) / 1000);
    return conn.reply(chatId, `⚠️ Espera ${remaining} segundos\n⚠️ Advertencia (${warns}/${MAX_WARNS})`, m);
  }

  cooldowns[user] = now;
  setTimeout(() => delete cooldowns[user], COOLDOWN_TIME);

  if (!text?.trim()) return conn.reply(chatId, `⚠️ Ingresa el nombre o enlace del video.`, m);

  await m.react('🔎');

  const videoMatch = text.match(/(?:youtube.com|youtu.be)\/(?:watch\?v=|embed\/|shorts\/|v\/)?([a-zA-Z0-9_-]{11})/);
  const query = videoMatch ? `https://youtu.be/${videoMatch[1]}` : text;

  const search = await yts(query);
  const result = videoMatch
    ? search.videos.find(v => v.videoId === videoMatch[1]) || search.videos[0]
    : search.videos[0];

  if (!result) return conn.reply(chatId, "❌ No se encontraron resultados.", m);

  const { title, thumbnail, timestamp, views, ago, url, author } = result;
  const vistas = formatViews(views);

  const info = `🎬 *${title}*
📺 *Canal:* ${author.name || "Desconocido"}
👀 *Vistas:* ${vistas}
⏱️ *Duración:* ${timestamp || 'N/A'}
📅 *Publicado:* ${ago || 'N/A'}
🔗 *Link:* ${url}`;

  await conn.sendMessage(chatId, { image: { url: thumbnail }, caption: info }, { quoted: m });

  try {
    if (['play', 'mp3'].includes(command)) {
      const audio = await savetube.download(url);
      if (!audio.status) throw audio.error;
      await conn.sendMessage(chatId, { audio: { url: audio.result.download }, mimetype: 'audio/mpeg', fileName: `${title}.mp3` }, { quoted: m });
    } else if (['play2', 'mp4'].includes(command)) {
      const video = await getVid(url);
      if (!video?.url) throw "Error al descargar video";
      await conn.sendMessage(chatId, { video: { url: video.url }, mimetype: 'video/mp4', fileName: `${title}.mp4` }, { quoted: m });
    }
  } catch (e) {
    console.error(e);
    conn.reply(chatId, `⚠️ Error: ${e}`, m);
  }
};

handler.command = handler.help = ['play', 'play2', 'mp3', 'mp4'];
handler.tags = ['download'];
export default handler;

// =========================
// Auxiliares
// =========================

async function getVid(url) {
  const r = await fetch(`https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(url)}`);
  const j = await r.json();
  return { url: j?.result?.formats?.[0]?.url || j?.result?.url };
}

function formatViews(v) {
  if (!v) return "N/A";
  if (v >= 1e9) return (v / 1e9).toFixed(1) + "B";
  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return v.toString();
}
