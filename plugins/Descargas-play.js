import fetch from "node-fetch";
import fs, { promises as fsPromises, existsSync, mkdirSync } from "fs";
import path from "path";

global.db = global.db || {};
global.db.users = global.db.users || {};

const forbiddenWords = [
  "roa", "peke77", "callejero fino", "anuel",
  "l-gante", "lgante", "hades", "bad bunny", "badbunny"
];

const txt = {
  banSpam: "⛔ Fuiste baneado por spam.",
  advSpam: (time, atts) => `⚠️ Esperá ${time} antes de volver a usar el comando.\nIntentos: ${atts}/4`,
  ingresarTitulo: "🎵 Escribí el nombre del video.",
  sendPreview: (isAudio, title) =>
    `╔══════════════════════╗
║ 🎶 YOUTUBE ${isAudio ? "AUDIO" : "VIDEO"}
╠══════════════════════╣
║ 📌 Título:
║ ${title}
║
║ ⏳ Estado: Descargando…
║ ⚡ Calidad: Óptima
║ 🔐 Proceso seguro
╚══════════════════════╝`,
};

// Crear carpeta tmp si no existe
if (!existsSync("./tmp")) mkdirSync("./tmp");

let handler = async (m, { conn, args, text, isOwner, command }) => {
  if (!global.db.users[m.sender]) {
    global.db.users[m.sender] = { lastmining: 0, commandAttempts: 0, banned: false };
  }
  const user = global.db.users[m.sender];

  if (user.banned && !isOwner) return conn.sendMessage(m.chat, { text: txt.banSpam }, { quoted: m });

  const waitTime = 120000;
  let time = user.lastmining + waitTime;
  let remainingTime = Math.ceil((time - new Date()) / 1000);

  if (!isOwner && new Date() - user.lastmining < waitTime) {
    user.commandAttempts++;
    if (user.commandAttempts > 4) {
      user.banned = true;
      return conn.sendMessage(m.chat, { text: txt.banSpam }, { quoted: m });
    }
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    const formattedTime = minutes > 0 ? `${minutes} min ${seconds} seg` : `${seconds} seg`;
    return conn.sendMessage(m.chat, { text: txt.advSpam(formattedTime, user.commandAttempts) }, { quoted: m });
  }

  if (!text) return conn.sendMessage(m.chat, { text: txt.ingresarTitulo }, { quoted: m });

  if (!isOwner) {
    user.lastmining = new Date() * 1;
    user.commandAttempts = 0;
  }

  const userQuery = text.toLowerCase();
  if (!isOwner) {
    for (const word of forbiddenWords) {
      if (userQuery.includes(word)) {
        await m.react("🤢");
        return conn.sendMessage(m.chat, { text: "🚫 *Ese artista o contenido no está permitido en este bot.*" }, { quoted: m });
      }
    }
  }

  await m.react("⌛");

  try {
    // 🔹 Usar API externa
    const apiKey = "TU_API_KEY_LOLHUMAN"; // opcional si usas lolhuman
    const query = encodeURIComponent(text);
    // URL API xzn.wtf
    const apiUrl = `https://xzn.wtf/api/ytdl?url=https://www.youtube.com/results?search_query=${query}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data || !data.url) return conn.sendMessage(m.chat, { text: "❌ No se encontró ningún resultado." }, { quoted: m });

    const isAudio = command === "play" || command === "audio";
    const messageType = isAudio ? "audio" : "video";
    const mimeType = isAudio ? "audio/mp4" : undefined;
    const fileExtension = isAudio ? ".m4a" : ".mp4";
    const randomFileName = Math.random().toString(36).substring(2, 15);
    const outputPath = path.join("./tmp", `${randomFileName}${fileExtension}`);

    // Descargar archivo
    const mediaRes = await fetch(isAudio ? data.audio : data.video);
    const buffer = Buffer.from(await mediaRes.arrayBuffer());
    await fsPromises.writeFile(outputPath, buffer);

    await conn.sendFile(
      m.chat,
      outputPath,
      undefined,
      txt.sendPreview(isAudio, data.title || text),
      m,
      { mimetype: mimeType }
    );

    await fsPromises.unlink(outputPath);

  } catch (e) {
    console.error("Error play:", e);
    return conn.sendMessage(m.chat, { text: "⚠️ Error al descargar el video vía API." }, { quoted: m });
  }
};

handler.command = ["play", "audio", "video", "vídeo"];

export default handler;
