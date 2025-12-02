// plugins/media-save.js
import fs from 'fs';
import path from 'path';

const handler = async (m, { conn }) => {
  try {
    if (!m.message) return;

    // Crear carpeta si no existe
    const mediaFolder = './media';
    if (!fs.existsSync(mediaFolder)) fs.mkdirSync(mediaFolder);

    // Asegurar la DB
    global.db.data.mediaList = global.db.data.mediaList || [];

    // Detectar tipo de medio
    const mtype = m.mtype;

    let type = null;
    if (mtype === 'imageMessage') type = 'image';
    else if (mtype === 'videoMessage') type = 'video';
    else if (mtype === 'audioMessage') type = 'audio';
    else if (mtype === 'documentMessage') type = 'document';
    else return; // ignorar si no es media

    const buffer = await conn.downloadMediaMessage(m);
    if (!buffer) return;

    // Nombre de archivo
    const filename = `${Date.now()}_${Math.floor(Math.random()*9999)}`;
    const extension =
      type === 'image'  ? '.jpg' :
      type === 'video'  ? '.mp4' :
      type === 'audio'  ? '.mp3' :
      type === 'document' ? `_${m.message.documentMessage?.fileName || 'file'}` :
      '';

    const finalName = filename + extension;
    const filepath = path.join(mediaFolder, finalName);

    // Guardar archivo
    fs.writeFileSync(filepath, buffer);

    // Obtener info adicional
    const chat = await conn.groupMetadata?.(m.chat).catch(() => null);

    const entry = {
      id: global.db.data.mediaList.length + 1,
      filename: finalName,
      path: filepath,
      type,
      from: m.sender,
      groupId: m.isGroup ? m.chat : null,
      groupName: m.isGroup ? (chat?.subject || '') : null,
      date: new Date().toLocaleString()
    };

    global.db.data.mediaList.push(entry);

    console.log("[MEDIA GUARDADO]", entry);

  } catch (e) {
    console.error("ERROR guardando media:", e);
  }
};

handler.help = [];
handler.tags = ["info"];
handler.command = []; // Se ejecuta automáticamente
export default handler;
