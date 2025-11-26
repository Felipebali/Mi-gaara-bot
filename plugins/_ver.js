// 📂 plugins/_ver.js — FelixCat-Bot 🐾
// Recupera fotos, videos o stickers en su formato original
// Solo los owners pueden usarlo 👑

import { webp2png } from '../lib/webp2mp4.js'

const extractMedia = (msg) => {
  let m = msg;

  if (m?.msg?.viewOnceMessageV2) m = m.msg.viewOnceMessageV2.message;
  if (m?.msg?.viewOnceMessageV2Extension) m = m.msg.viewOnceMessageV2Extension.message;
  if (m?.msg?.ephemeralMessage) m = m.msg.ephemeralMessage.message;
  if (m?.msg?.extendedTextMessage) return null; // No es media

  return m;
};

let handler = async (m, { conn }) => {
  const owners = global.owner.map(o => o[0].replace(/[^0-9]/g, ''));
  const senderNumber = m.sender.replace(/[^0-9]/g, '');

  if (!owners.includes(senderNumber)) {
    await m.react('✖️');
    return conn.reply(m.chat, '❌ Solo los *owners* pueden usar este comando.', m);
  }

  try {
    const q = m.quoted ? m.quoted : m;
    const realMsg = extractMedia(q);

    if (!realMsg)
      return conn.reply(m.chat, '⚠️ Responde a una *imagen, sticker o video*.', m);

    const type = Object.keys(realMsg)[0];
    const content = realMsg[type];

    if (!content || !content.mimetype)
      return conn.reply(m.chat, '⚠️ Ese mensaje no contiene archivo descargable.', m);

    const mime = content.mimetype;

    // ❗ Protección contra el error "empty media key"
    if (!content.mediaKey || !content.url) {
      return conn.reply(
        m.chat,
        '⚠️ No puedo recuperar este archivo (mensaje destruido, view-once ya abierto o incompleto).',
        m
      );
    }

    await m.react('📥');
    let buffer = await q.download();

    if (!buffer)
      return conn.reply(m.chat, '❌ No pude descargar el archivo.', m);

    // ⭐ Convertir sticker WEBP a PNG
    if (/webp/.test(mime)) {
      const result = await webp2png(buffer);
      if (result?.url) {
        await conn.sendFile(
          m.chat,
          result.url,
          'sticker.png',
          '🖼️ Sticker convertido a imagen.',
          m
        );
        await m.react('✅');
        return;
      }
    }

    // ⭐ Imagen / video normal
    const ext = mime.split('/')[1];
    await conn.sendFile(
      m.chat,
      buffer,
      `recuperado.${ext}`,
      '📸 Archivo recuperado.',
      m
    );
    await m.react('✅');

  } catch (e) {
    console.error(e);
    await conn.reply(m.chat, '⚠️ Error al recuperar el archivo.', m);
    await m.react('✖️');
  }
};

handler.help = ['ver'];
handler.tags = ['tools', 'owner'];
handler.command = ['ver', 'r'];
handler.owner = false;

export default handler;
