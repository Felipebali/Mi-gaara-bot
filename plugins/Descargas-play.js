import yts from "yt-search"
import fetch from "node-fetch"
import crypto from "crypto"
import axios from "axios"

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text?.trim())
    return conn.reply(m.chat, `⚠️ Ingresa el nombre o enlace del video.`, m);

  await m.react('🔎');

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

  const fkontak = {
    key: { fromMe: false, participant: "0@s.whatsapp.net" },
    message: { documentMessage: { title: `「 ${title} 」`, fileName: global.botname || "Bot", jpegThumbnail: thumb } }
  };

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
      const audio = await savetube.download(url, "audio");
      if (!audio?.status) throw audio?.error || "Error al obtener el audio";
      await conn.sendMessage(m.chat, { audio: { url: audio.result.download }, mimetype: 'audio/mpeg', fileName: `${title}.mp3` }, { quoted: fkontak });
      await m.react('✔️');
    }

    else if (['play2', 'mp4'].includes(command)) {
      await m.react('🎬');
      const video = await getVid(url);
      if (!video?.url) throw "No se pudo obtener el video.";
      await conn.sendMessage(m.chat, { video: { url: video.url }, mimetype: 'video/mp4', fileName: `${title}.mp4`, caption: `🎥 ${title}` }, { quoted: fkontak });
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

//=================
// Funciones auxiliares

async function getVid(url) {
  try {
    const r = await fetch(`https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(url)}`);
    const res = await r.json();
    return { url: res?.result?.formats?.[0]?.url || res?.result?.url };
  } catch { return null; }
}

const savetube = {
  youtube: url => {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  },
  headers: { "User-Agent": "Mozilla/5.0" },
  api: { base: "https://media.savetube.me/api", info: "/v2/info", download: "/download", cdn: "/random-cdn" },
  request: async (endpoint, data = {}, method = "post") => {
    try {
      const url = endpoint.startsWith("http") ? endpoint : `${savetube.api.base}${endpoint}`;
      const { data: res } = await axios({ method, url, data: method === "post" ? data : undefined, params: method === "get" ? data : undefined, headers: savetube.headers });
      return { status: true, data: res };
    } catch (err) { return { status: false, error: err.message }; }
  },
  getCDN: async () => {
    const res = await savetube.request(savetube.api.cdn, {}, "get");
    return res.status ? { status: true, data: res.data.cdn } : res;
  },
  crypto: {
    hexToBuffer: hex => Buffer.from(hex.match(/.{1,2}/g).join(""), "hex"),
    decrypt: async enc => {
      const secretKey = "C5D58EF67A7584E4A29F6C35BBC4EB12";
      const data = Buffer.from(enc, "base64");
      const iv = data.slice(0, 16);
      const content = data.slice(16);
      const key = savetube.crypto.hexToBuffer(secretKey);
      const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
      return JSON.parse(Buffer.concat([decipher.update(content), decipher.final()]).toString());
    }
  },
  download: async (link) => {
    const id = savetube.youtube(link);
    if (!id) return { status: false, error: "ID no encontrado" };
    try {
      const cdnRes = await savetube.getCDN();
      if (!cdnRes.status) return cdnRes;
      const info = await savetube.request(`https://${cdnRes.data}${savetube.api.info}`, { url: `https://www.youtube.com/watch?v=${id}` });
      if (!info.status) return info;
      const dec = await savetube.crypto.decrypt(info.data.data);
      const dl = await savetube.request(`https://${cdnRes.data}${savetube.api.download}`, { id, downloadType: "audio", quality: "mp3", key: dec.key });
      return dl.data?.data?.downloadUrl ? { status: true, result: { download: dl.data.data.downloadUrl, title: dec.title } } : { status: false, error: "No se pudo descargar" };
    } catch (e) { return { status: false, error: e.message }; }
  }
};

function formatViews(v) {
  if (!v) return "N/A";
  if (v >= 1e9) return (v / 1e9).toFixed(1) + "B";
  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return v.toString();
}
