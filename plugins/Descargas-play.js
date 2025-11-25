import fetch from "node-fetch";
import yts from "yt-search";

const youtubeRegexID = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/;

const cooldowns = {};
const warnings = {}; 
const warningTimers = {};
const owners = ["59896026646@s.whatsapp.net", "59898719147@s.whatsapp.net"];

const handler = async (m, { conn, text, command }) => {
  try {

    if (!text?.trim()) {
      return conn.reply(m.chat, `⚽ *Por favor, ingresa el nombre o enlace del video.*`, m);
    }

    const now = Date.now();
    const lastUsed = cooldowns[m.sender] || 0;
    const waitTime = 2 * 60 * 1000;
    const isOwnerUser = owners.includes(m.sender);

    // SISTEMA DE COOLDOWN + ADVERTENCIAS + EXPULSIÓN
    if (!isOwnerUser) {
      if (now - lastUsed < waitTime) {

        warnings[m.sender] = (warnings[m.sender] || 0) + 1;

        if (warningTimers[m.sender]) clearTimeout(warningTimers[m.sender]);
        warningTimers[m.sender] = setTimeout(() => {
          warnings[m.sender] = 0;
        }, 3 * 60 * 1000);

        const remaining = Math.ceil((waitTime - (now - lastUsed)) / 1000);

        if (warnings[m.sender] >= 5) {

          if (m.isGroup) {
            try {
              await conn.sendMessage(m.chat, {
                text: `🚫 *${warnings[m.sender]} advertencias acumuladas.*\n🔨 @${m.sender.split("@")[0]} será expulsado.`,
                mentions: [m.sender]
              });

              await conn.groupParticipantsUpdate(m.chat, [m.sender], "remove");

            } catch {
              return m.reply("❌ No pude expulsarlo. ¿Soy admin?");
            }
          }

          warnings[m.sender] = 0;
          clearTimeout(warningTimers[m.sender]);
          return;
        }

        return conn.reply(
          m.chat,
          `⚠ *Advertencia ${warnings[m.sender]}/5*\n⏳ Debes esperar *${remaining} segundos* antes de pedir otra música.`,
          m
        );
      }

      cooldowns[m.sender] = now;
      warnings[m.sender] = 0;
      if (warningTimers[m.sender]) clearTimeout(warningTimers[m.sender]);
    }

    // Easter egg
    if (/rammstein/i.test(text)) {
      await m.react('🔥');
      await conn.reply(m.chat, '🇩🇪 *Deutschland über alles* ⚡', m);
    }

    await m.react('🔎');

    // BUSCAR VIDEO EN YOUTUBE
    const videoIdMatch = text.match(youtubeRegexID);
    const search = await yts(videoIdMatch ? 'https://youtu.be/' + videoIdMatch[1] : text);

    const video = videoIdMatch
      ? search.all.find(v => v.videoId === videoIdMatch[1]) ||
        search.videos.find(v => v.videoId === videoIdMatch[1])
      : search.videos?.[0];

    if (!video) {
      return conn.reply(m.chat, '✧ No se encontraron resultados para tu búsqueda.', m);
    }

    const { title, thumbnail, timestamp, views, ago, url, author } = video;

    const infoMessage = `
🕸️ Titulo: ${title}
🌿 Canal: ${author?.name || 'Desconocido'}
🍋 Vistas: ${formatViews(views)}
🍃 Duración: ${timestamp || 'Desconocido'}
📆 Publicado: ${ago || 'Desconocido'}
🚀 Enlace: ${url}`.trim();

    await conn.sendMessage(
      m.chat,
      {
        image: { url: thumbnail },
        caption: infoMessage,
        contextInfo: {
          externalAdReply: {
            title: title,
            thumbnailUrl: thumbnail,
            sourceUrl: url,
            mediaType: 1
          }
        }
      },
      { quoted: m }
    );

    // ----------------------- AUDIO (con 2 APIs estables) -----------------------
    if (command === 'ytplay' || command === 'ytaudio') {
      try {
        let audioUrl = null;
        let titulo = title;

        // API 1 (Cafirexos)
        try {
          const res1 = await fetch(`https://api.cafirexos.com/api/v1/ytmp3?url=${encodeURIComponent(url)}`);
          const json1 = await res1.json();

          if (json1.status && json1.data?.download_url) {
            audioUrl = json1.data.download_url;
            titulo = json1.data.title || title;
          }
        } catch {}

        // API 2 (Stellar) si falla API 1
        if (!audioUrl) {
          const res2 = await fetch(`https://api.stellarwa.xyz/ytmp3?url=${encodeURIComponent(url)}&apikey=Shadow_Core`);
          const json2 = await res2.json();

          if (json2.status && json2.data?.dl) {
            audioUrl = json2.data.dl;
            titulo = json2.data.title || title;
          }
        }

        if (!audioUrl) {
          return conn.reply(m.chat, "⚠ *No se pudo obtener el audio.* Las APIs están caídas.", m);
        }

        await conn.sendMessage(
          m.chat,
          {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: `${titulo}.mp3`
          },
          { quoted: m }
        );

        await m.react('🎶');
      } catch {
        return conn.reply(m.chat, '⚠ No se pudo enviar el audio. Intenta más tarde.', m);
      }
    }

    // ----------------------- VIDEO (con 2 APIs estables) -----------------------
    else if (command === 'ytvideo' || command === 'ytplay2') {
      try {
        let videoUrl = null;
        let titulo = title;

        // API 1 (Cafirexos)
        try {
          const res1 = await fetch(`https://api.cafirexos.com/api/v1/ytmp4?url=${encodeURIComponent(url)}`);
          const json1 = await res1.json();

          if (json1.status && json1.data?.download_url) {
            videoUrl = json1.data.download_url;
            titulo = json1.data.title || title;
          }
        } catch {}

        // API 2 (Stellar)
        if (!videoUrl) {
          const res2 = await fetch(`https://api.stellarwa.xyz/dow/ytmp4?url=${encodeURIComponent(url)}&apikey=Shadow_Core`);
          const json2 = await res2.json();

          if (json2.status && json2.data?.dl) {
            videoUrl = json2.data.dl;
            titulo = json2.data.title || title;
          }
        }

        if (!videoUrl) {
          return conn.reply(m.chat, "⚠ *No se pudo obtener el video.* Las APIs están caídas.", m);
        }

        await conn.sendMessage(
          m.chat,
          {
            video: { url: videoUrl },
            caption: `🎬 *${titulo}*\n⏳ Duración: ${timestamp || "Desconocida"}`,
            mimetype: 'video/mp4',
            fileName: `${titulo}.mp4`
          },
          { quoted: m }
        );

        await m.react('🎥');
      } catch {
        return conn.reply(m.chat, '⚠ No se pudo enviar el video. Intenta más tarde.', m);
      }
    }

    else {
      return conn.reply(m.chat, '✧ Comando no reconocido.', m);
    }

  } catch (err) {
    console.error(err);
    return m.reply(`⚠ Ocurrió un error:\n${err}`);
  }
};

// COMANDOS
handler.command = ['ytplay', 'ytaudio', 'ytvideo', 'ytplay2'];
handler.help = ['ytplay', 'ytaudio', 'ytvideo', 'ytplay2'];
handler.tags = ['descargas'];
export default handler;

function formatViews(views) {
  if (views === undefined) return "No disponible";
  if (views >= 1e9) return `${(views / 1e9).toFixed(1)}B (${views.toLocaleString()})`;
  if (views >= 1e6) return `${(views / 1e6).toFixed(1)}M (${views.toLocaleString()})`;
  if (views >= 1e3) return `${(views / 1e3).toFixed(1)}K (${views.toLocaleString()})`;
  return views.toString();
}
