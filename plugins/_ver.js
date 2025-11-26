// 📂 plugins/_ver.js — FelixCat-Bot 🐾
// Recupera fotos, videos o stickers en su formato original
// Solo los owners pueden usarlo 👑

import { webp2png } from '../lib/webp2mp4.js'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

function unwrap(msg) {
  let m = msg.msg || msg.message || msg; 

  if (m.viewOnceMessageV2) m = m.viewOnceMessageV2.message;
  if (m.viewOnceMessageV2Extension) m = m.viewOnceMessageV2Extension.message;
  if (m.ephemeralMessage) m = m.ephemeralMessage.message;

  return m;
}

async function getBuffer(msg) {
  const type = Object.keys(msg)[0];
  const media = msg[type];

  if (!media?.url || !media?.mediaKey) return null;

  const kind = media.mimetype.split('/')[0];
  const stream = await downloadContentFromMessage(media, kind);

  let buffer = Buffer.from([]);
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

  return buffer;
}

let handler = async (m, { conn }) => {

  // --- OWNERS ---
  const owners = global.owner.map(o => o[0].replace(/[^0-9]/g, ''));
  const senderNumber = m.sender.replace(/[^0-9]/g, '');
  if (!owners.includes(senderNumber)) {
    await m.react('✖️');
    return conn.reply(m.chat, '❌ Solo los *owners* pueden usar este comando.', m);
  }

  try {
    const q = m.quoted ? m.quoted : m;

    // DESENVOLVER LA ESTRUCTURA REAL QUE TRAE MEDIA
    const real = unwrap(q.msg || q.message || q);

    if (!real)
      return conn.reply(m.chat, '⚠️ Ese mensaje no contiene archivo.', m);

    const type = Object.keys(real)[0];
    const media = real[type];

    if (!media?.mimetype)
      return conn.reply(m.chat, '⚠️ Ese mensaje no contiene archivo descargable.', m);

    const mime = media.mimetype;

    await m.react('📥');

    // Descargar el archivo real (view-once incluido)
    const buffer = await getBuffer(real);
    if (!buffer)
      return conn.reply(
        m.chat,
        '❌ No pude recuperar el archivo (posible view-once ya abierto).',
        m
      );

    // STICKERS WEBP → PNG
    if (/webp/.test(mime)) {
      const img = await webp2png(buffer);
      if (img?.url) {
        await conn.sendFile(m.chat, img.url, 'sticker.png', '🖼️ Sticker convertido a imagen.', m);
        return m.react('✅');
      }
    }

    // ARCHIVO NORMAL (foto/video)
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

handler.help = ['ver']
handler.tags = ['tools', 'owner']
handler.command = ['ver', 'r']
handler.owner = false

export default handler
