import fetch from "node-fetch";
import yts from "yt-search";
import { spawn } from "child_process";
import fs from "fs";

const youtubeRegexID = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/;

const cooldowns = {};
const warnings = {};
const warningTimers = {};
const owners = ["59896026646@s.whatsapp.net", "59898719147@s.whatsapp.net"];

// ⬇️ NUEVO: yt-dlp estable y sin errores
async function downloadYTDLP(url, output, mode) {
  return new Promise((resolve, reject) => {

    let args = [];

    if (mode === "audio") {
      args = [
        "-f", "bestaudio",
        "--extract-audio",
        "--audio-format", "mp3",
        "-o", output,
        url
      ];
    } else if (mode === "video") {
      args = [
        "-f", "bestvideo+bestaudio/best",
        "-o", output,
        url
      ];
    }

    const ytdlp = spawn("yt-dlp", args);

    ytdlp.stderr.on("data", () => {});

    ytdlp.on("close", (code) => {
      if (code === 0 && fs.existsSync(output)) resolve(output);
      else reject("Error al ejecutar yt-dlp");
    });
  });
}

const handler = async (m, { conn, text, command }) => {
  try {

    if (!text?.trim()) {
      return conn.reply(m.chat, `⚽ *Por favor, ingresa el nombre o enlace del video.*`, m);
    }

    const now = Date.now();
    const lastUsed = cooldowns[m.sender] || 0;
    const waitTime = 2 * 60 * 1000;
    const isOwnerUser = owners.includes(m.sender);

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
          `⚠ *Advertencia ${warnings[m.sender]}/5*\n⏳ Aún debes esperar *${remaining} segundos*.`,
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

    const videoIdMatch = text.match(youtubeRegexID);
    const search = await yts(videoIdMatch ? "https://youtu.be/" + videoIdMatch[1] : text);

    const video = videoIdMatch
      ? search.all.find(v => v.videoId === videoIdMatch[1]) ||
        search.videos.find(v => v.videoId === videoIdMatch[1])
      : search.videos?.[0];

    if (!video) {
      return conn.reply(m.chat, "✧ No se encontraron resultados para tu búsqueda.", m);
    }

    const { title, thumbnail, timestamp, views, ago, url, author } = video;

    const infoMessage = `
🕸️ Titulo: ${title}
🌿 Canal: ${author?.name || "Desconocido"}
🍋 Vistas: ${formatViews(views)}
🍃 Duración: ${timestamp || "Desconocido"}
📆 Publicado: ${ago || "Desconocido"}
🚀 Enlace: ${url}
`.trim();

    await conn.sendMessage(
      m.chat,
      {
        image: { url: thumbnail },
        caption: infoMessage,
        contextInfo: {
          externalAdReply: {
            title,
            thumbnailUrl: thumbnail,
            sourceUrl: url
          }
        }
      },
      { quoted: m }
    );

    // 🔊 AUDIO — AHORA FUNCIONA SIEMPRE
    if (command === "ytplay" || command === "ytaudio") {
      try {
        const output = `/sdcard/${title}.mp3`;

        await downloadYTDLP(url, output, "audio");

        await conn.sendMessage(
          m.chat,
          {
            audio: fs.readFileSync(output),
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`
          },
          { quoted: m }
        );

        fs.unlinkSync(output);
        await m.react("🎶");

      } catch (e) {
        console.log(e);
        return conn.reply(m.chat, "⚠ Error al descargar el audio.", m);
      }
    }

    // 🎥 VIDEO — SIN ERRORES DE FORMATO
    else if (command === "ytvideo" || command === "ytplay2") {
      try {
        const output = `/sdcard/${title}.mp4`;

        await downloadYTDLP(url, output, "video");

        await conn.sendMessage(
          m.chat,
          {
            video: fs.readFileSync(output),
            mimetype: "video/mp4"
          },
          { quoted: m }
        );

        fs.unlinkSync(output);
        await m.react("🎥");

      } catch (e) {
        console.log(e);
        return conn.reply(m.chat, "⚠ Error al descargar el video.", m);
      }
    }

  } catch (err) {
    console.log(err);
    return m.reply("⚠ Ocurrió un error.");
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
