// plugins/media-save.js
import fs from 'fs';
import path from 'path';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

const handler = {};
handler.all = async function (m) {
  try {
    if (!m.msg) return;

    const mediaFolder = './media';
    if (!fs.existsSync(mediaFolder)) fs.mkdirSync(mediaFolder);

    global.db.data.mediaList = global.db.data.mediaList || [];

    let type = null;
    let messageForDownload = m;

    // 🔥 DETECTAR VIEW-ONCE EN GAARA ULTRA
    if (m.msg.viewOnce) {
      if (m.msg.mimetype?.includes("image")) type = "image";
      else if (m.msg.mimetype?.includes("video")) type = "video";

      messageForDownload = {
        ...m,
        message: {
          imageMessage: m.msg,
          videoMessage: m.msg
        }
      };
    }

    // 🔥 DETECTAR MEDIA NORMAL
    else {
      if (m.mtype === "imageMessage") type = "image";
      else if (m.mtype === "videoMessage") type = "video";
      else if (m.mtype === "audioMessage") type = "audio";
      else if (m.mtype === "documentMessage") type = "document";
      else return;
    }

    // Descargar media
    const buffer = await downloadMediaMessage(messageForDownload, "buffer");
    if (!buffer) return;

    // Nombre
    const filename = `${Date.now()}_${Math.floor(Math.random() * 9999)}`;
    const ext =
      type === "image" ? ".jpg" :
      type === "video" ? ".mp4" :
      type === "audio" ? ".mp3" :
      type === "document" ? `_${m.msg.fileName || "file"}` :
      "";

    const finalName = filename + ext;
    const filepath = path.join(mediaFolder, finalName);

    fs.writeFileSync(filepath, buffer);

    // Group info
    let chatInfo = null;
    if (m.isGroup) {
      try {
        chatInfo = await this.groupMetadata(m.chat);
      } catch {}
    }

    // Guardar registro
    const entry = {
      id: global.db.data.mediaList.length + 1,
      filename: finalName,
      path: filepath,
      type,
      from: m.sender,
      viewOnce: !!m.msg.viewOnce,
      groupId: m.isGroup ? m.chat : null,
      groupName: m.isGroup ? (chatInfo?.subject || '') : null,
      date: new Date().toLocaleString()
    };

    global.db.data.mediaList.push(entry);
    console.log('[MEDIA GUARDADO]', entry);

  } catch (e) {
    console.error("ERROR guardando media:", e);
  }
};

export default handler;
