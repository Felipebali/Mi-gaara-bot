import fetch from "node-fetch";
import yts from "yt-search";

const youtubeRegexID =
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/;

const cooldowns = {};
const warnings = {};
const warningTimers = {};
const owners = ["59896026646@s.whatsapp.net", "59898719147@s.whatsapp.net"];

// 🔥 API SUPER ESTABLE
const API_BASE = "https://ytdl.redchef.es";

const handler = async (m, { conn, text, command }) => {
  try {
    if (!text?.trim()) {
      return conn.reply(
        m.chat,
        `⚽ *Por favor, ingresa el nombre o enlace del video.*`,
        m
      );
    }

    // Cooldown
    const now = Date.now();
    const lastUsed = cooldowns[m.sender] || 0;
    const waitTime = 2 * 60 * 1000;
    const isOwnerUser = owners.includes(m.sender);

    if (!isOwnerUser) {
      if (now - lastUsed < waitTime) {
        warnings[m.sender] = (warnings[m.sender] || 0) + 1;

        if (warningTimers[m.sender]) clearTimeout(warningTimers[m.sender]);
        warningTimers[m.sender] = setTimeout(
          () => (warnings[m.sender] = 0),
          3 * 60 * 1000
        );

        const remaining = Math.ceil(
          (waitTime - (now - lastUsed)) / 1000
        );

        if (warnings[m.sender] >= 5 && m.isGroup) {
          try {
            await conn.sendMessage(m.chat, {
              text: `🚫 *${warnings[m.sender]} advertencias acumuladas.*\n🔨 @${m.sender.split("@")[0]} será expulsado.`,
              mentions: [m.sender],
            });

            await conn.groupParticipantsUpdate(m.chat, [m.sender], "remove");
          } catch {
            return m.reply("❌ No pude expulsarlo. ¿Soy admin?");
          }

          warnings[m.sender] = 0;
          clearTimeout(warningTimers[m.sender]);
          return;
        }

        return conn.reply(
          m.chat,
          `⚠ *Advertencia ${warnings[m.sender]}/5*\n⏳ Espera *${remaining} segundos*.`,
          m
        );
      }

      cooldowns[m.sender] = now;
      warnings[m.sender] = 0;
      if (warningTimers[m.sender]) clearTimeout(warningTimers[m.sender]);
    }

    if (/rammstein/i.test(text)) {
      await m.react("🔥");
      await conn.reply(m.chat, "🇩🇪 *Deutschland über alles* ⚡", m);
    }

    await m.react("🔎");

    // Buscar en YouTube
    const videoIdMatch = text.match(youtubeRegexID);
    const search = await yts(
      videoIdMatch ? "https://youtu.be/" + videoIdMatch[1] : text
    );

    const video = videoIdMatch
      ? search.all.find((v) => v.videoId === videoIdMatch[1]) ||
        search.videos.find((v) => v.videoId === videoIdMatch[1])
      : search.videos?.[0];

    if (!video) {
      return conn.reply(
        m.chat,
        "✧ No se encontraron resultados para tu búsqueda.",
        m
      );
    }

    const { title, thumbnail, timestamp, views, ago, url, author } = video;

    // Enviar info
    await conn.sendMessage(
      m.chat,
      {
        image: { url: thumbnail },
        caption: `
🕸️ Título: ${title}
🌿 Canal: ${author?.name || "Desconocido"}
🍋 Vistas: ${formatViews(views)}
🍃 Duración: ${timestamp}
📆 Publicado: ${ago}
🚀 Enlace: ${url}
        `.trim(),
        contextInfo: {
          externalAdReply: {
            title,
            thumbnailUrl: thumbnail,
            sourceUrl: url,
          },
        },
      },
      { quoted: m }
    );

    // 🔊 AUDIO — API Estable
    if (command === "ytplay" || command === "ytaudio") {
      await m.react("⬇️");

      const api = `${API_BASE}/audio?url=${encodeURIComponent(url)}`;
      const dl = await fetch(api);
      const json = await dl.json();

      if (!json.status) return conn.reply(m.chat, "⚠ Error al generar audio.", m);

      await conn.sendMessage(
        m.chat,
        {
          audio: { url: json.audio },
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`,
        },
        { quoted: m }
      );

      await m.react("🎶");
    }

    // 🎥 VIDEO — API Estable
    else if (command === "ytvideo" || command === "ytplay2") {
      await m.react("⬇️");

      const api = `${API_BASE}/video?url=${encodeURIComponent(url)}`;
      const dl = await fetch(api);
      const json = await dl.json();

      if (!json.status) return conn.reply(m.chat, "⚠ Error al generar video.", m);

      await conn.sendMessage(
        m.chat,
        {
          video: { url: json.video },
          mimetype: "video/mp4",
          caption: title,
        },
        { quoted: m }
      );

      await m.react("🎥");
    }
  } catch (err) {
    console.error(err);
    return m.reply("⚠ Ocurrió un error inesperado.");
  }
};

handler.command = ["ytplay", "ytaudio", "ytvideo", "ytplay2"];
handler.tags = ["descargas"];

export default handler;

function formatViews(views) {
  if (!views) return "No disponible";
  if (views >= 1e9) return `${(views / 1e9).toFixed(1)}B`;
  if (views >= 1e6) return `${(views / 1e6).toFixed(1)}M`;
  if (views >= 1e3) return `${(views / 1e3).toFixed(1)}K`;
  return views.toString();
}
