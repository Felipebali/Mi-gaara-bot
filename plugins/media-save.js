// plugins/media-save.js
import fs from 'fs';
import path from 'path';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

const handler = {};
handler.all = async function (m) {
  try {
    if (!m.message) return;

    const mediaFolder = './media';
    if (!fs.existsSync(mediaFolder)) fs.mkdirSync(mediaFolder);

    global.db.data.mediaList = global.db.data.mediaList || [];

    // Detectar media normal
    let type = null;
    let messageForDownload = m;

    if (m.mtype === 'imageMessage') type = 'image';
    else if (m.mtype === 'videoMessage') type = 'video';
    else if (m.mtype === 'audioMessage') type = 'audio';
    else if (m.mtype === 'documentMessage') type = 'document';

    // Detectar VIEW ONCE
    else if (m.message.viewOnceMessageV2) {
      const v = m.message.viewOnceMessageV2.message;

      if (v.imageMessage) {
        type = 'image';
        messageForDownload = {
          ...m,
          message: v  // <- le pasamos la parte interna
        };
      } else if (v.videoMessage) {
        type = 'video';
        messageForDownload = {
          ...m,
          message: v
        };
      }
    }

    // Si no es media, salir
    if (!type) return;

    // Descargar media correctamente
    const buffer = await downloadMediaMessage(messageForDownload, "buffer");
    if (!buffer) return;

    // Nombre
    const filename = `${Date.now()}_${Math.floor(Math.random() * 9999)}`;
    const extension =
      type === 'image' ? '.jpg' :
      type === 'video' ? '.mp4' :
      type === 'audio' ? '.mp3' :
      type === 'document' ? `_${m.message.documentMessage?.fileName || 'file'}` :
      '';

    const finalName = filename + extension;
    const filepath = path.join(mediaFolder, finalName);

    fs.writeFileSync(filepath, buffer);

    // Info del grupo
    let chatInfo = null;
    if (m.isGroup) {
      try {
        chatInfo = await this.groupMetadata(m.chat);
      } catch { chatInfo = null; }
    }

    // Guardar registro
    const entry = {
      id: global.db.data.mediaList.length + 1,
      filename: finalName,
      path: filepath,
      type,
      from: m.sender,
      viewOnce: !!m.message.viewOnceMessageV2,
      groupId: m.isGroup ? m.chat : null,
      groupName: m.isGroup ? (chatInfo?.subject || '') : null,
      date: new Date().toLocaleString()
    };

    global.db.data.mediaList.push(entry);

    console.log("[MEDIA GUARDADO]", entry);

  } catch (e) {
    console.error("ERROR guardando media:", e);
  }
};

export default handler;
