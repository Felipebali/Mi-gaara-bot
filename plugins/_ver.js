// 📂 plugins/_ver.js — FelixCat-Bot 🐾
// Recupera fotos, videos o stickers en su formato original
// Solo los owners pueden usarlo 👑

import { webp2png } from '../lib/webp2mp4.js'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

function unwrap(msg) {
  let m = msg.msg || msg;

  if (m.viewOnceMessageV2) m = m.viewOnceMessageV2.message;
  if (m.viewOnceMessageV2Extension) m = m.viewOnceMessageV2Extension.message;
  if (m.ephemeralMessage) m = m.ephemeralMessage.message;

  return m;
}

async function getBuffer(msg) {
  const type = Object.keys(msg)[0];
  const media = msg[type];

  if (!media || !media.url || !media.mediaKey)
    return null;

  const stream = await downloadContentFromMessage(media, media.mimetype.split('/')[0]);
  let buffer = Buffer.from([]);

  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  return buffer;
}

let handler = async (m, { conn }) => {
  const owners = global.owner.map(o => o[0].replace(/[^0-9]/g, ''));
  const senderNumber = m.sender.replace(/[^0-9]/g, '');

  if (!owners.includes(senderNumber)) {
    await m.react('✖️');
    return conn.reply(m.chat, '❌ Solo los *owners* pueden usar este comando.', m);
  }

  try {
    const q = m.quoted ? m.quoted : m;

    // DESENVOLVER TODA LA MIERDA QUE MANDA BAILEYS
    const real = unwrap(q);

    if (!real)
      return conn.reply(m.chat, '⚠️ Ese mensaje no contiene ningún archivo.', m);

    const type = Object.keys(real)[0];
    const media = real[type];

    if (!media || !media.mimetype)
      return conn.reply(m.chat, '⚠️ Ese mensaje no contiene archivo descargable.', m);

    const mime = media.mimetype;

    await m.react('📥');

    // obtener buffer REAL del view-once
    const buffer = await getBuffer(real);
    if (!buffer)
      return conn.reply(m.chat, '❌ No pude recuperar el archivo (view-once destruido o inválido).', m);

    // STICKER
    if (/webp/.test(mime)) {
      const img = await webp2png(buffer);
      if (img?.url) {
        await conn.sendFile(m.chat, img.url, 'sticker.png', '🖼️ Sticker convertido a imagen.', m);
        return m.react('✅');
      }
    }

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
