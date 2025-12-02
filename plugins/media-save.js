import fs from 'fs';
import path from 'path';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const handler = {};
handler.all = async function (m) {
  try {
    if (!m.message) return;

    const mediaFolder = './media';
    if (!fs.existsSync(mediaFolder)) fs.mkdirSync(mediaFolder);

    global.db.data.mediaList = global.db.data.mediaList || [];

    let type = null;
    let realMsg = null;

    // 📌 1. DETECTAR VIEW ONCE
    if (m.mtype === "viewOnceMessageV2") {
      const v = m.message.viewOnceMessageV2.message;

      if (v.imageMessage) {
        type = "image";
        realMsg = v.imageMessage;
      } else if (v.videoMessage) {
        type = "video";
        realMsg = v.videoMessage;
      }
    }

    // 📌 2. MEDIA NORMAL
    else {
      if (m.mtype === "imageMessage") {
        type = "image";
        realMsg = m.message.imageMessage;
      } else if (m.mtype === "videoMessage") {
        type = "video";
        realMsg = m.message.videoMessage;
      } else if (m.mtype === "audioMessage") {
        type = "audio";
        realMsg = m.message.audioMessage;
      } else if (m.mtype === "documentMessage") {
        type = "document";
        realMsg = m.message.documentMessage;
      } else return;
    }

    if (!realMsg) return;

    // 📥 Descargar
    const stream = await downloadContentFromMessage(
      realMsg,
      type === "image" ? "image" :
      type === "video" ? "video" :
      "document"
    );

    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    // 📎 Nombre
    const filename = `${Date.now()}_${Math.floor(Math.random() * 9999)}`;
    const ext =
      type === "image" ? ".jpg" :
      type === "video" ? ".mp4" :
      type === "audio" ? ".mp3" :
      type === "document" ? `_${realMsg.fileName || "file"}` :
      "";

    const finalName = filename + ext;
    const filepath = path.join(mediaFolder, finalName);

    fs.writeFileSync(filepath, buffer);

    // 📌 info de grupo
    let groupName = null;
    if (m.isGroup) {
      try {
        const meta = await this.groupMetadata(m.chat);
        groupName = meta.subject || null;
      } catch {}
    }

    // Guardar en BD
    const entry = {
      id: global.db.data.mediaList.length + 1,
      filename: finalName,
      path: filepath,
      type,
      from: m.sender,
      viewOnce: m.mtype === "viewOnceMessageV2",
      groupId: m.isGroup ? m.chat : null,
      groupName,
      date: new Date().toLocaleString()
    };

    global.db.data.mediaList.push(entry);

    console.log("[MEDIA GUARDADO]", entry);

  } catch (e) {
    console.error("ERROR guardando media:", e);
  }
};

export default handler;
