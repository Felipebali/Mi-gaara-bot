// 📂 plugins/match.js — FULL COMPATIBLE CON CUALQUIER LOADER
console.log('[Plugin] match cargado');

let handler = async (m, { conn, args, command }) => {
  try {
    // 🔒 Verificación de sistema de juegos
    const chat = global.db.data.chats[m.chat] || {};
    if (!chat.games) return;

    if (!m.isGroup) return;

    // 📋 Obtener participantes
    const groupMetadata = await conn.groupMetadata(m.chat);
    let participants = groupMetadata.participants.map(p => p.id);
    const groupName = groupMetadata.subject || 'este grupo';

    // 🚫 Filtrar dueños y bot
    const botNumber = conn.user?.id.split(':')[0];
    const owners = ['59898719147', '59896026646'];
    participants = participants.filter(p => {
      const num = p.replace(/@s\.whatsapp\.net$/, '');
      return num !== botNumber && !owners.includes(num);
    });

    if (participants.length < 2) return;

    const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];

    // 💫 Frases aleatorias para hacerlo más divertido
    const frases = [
      '💘 *El destino los ha unido.*',
      '❤️ *El amor está en el aire.*',
      '💞 *Una pareja que haría historia.*',
      '💖 *Cupido hizo de las suyas.*',
      '💝 *Romance felino detectado.*'
    ];

    // 💌 Si usa ".match all"
    if (args[0] && args[0].toLowerCase() === 'all') {
      participants = participants.sort(() => Math.random() - 0.5);
      let msg = `💘 *MATCH GENERAL EN ${groupName.toUpperCase()}* 💘\n\n`;
      let mentions = [];

      for (let i = 0; i < participants.length; i += 2) {
        if (participants[i + 1]) {
          msg += `💞 @${participants[i].split('@')[0]} ❤️ @${participants[i + 1].split('@')[0]}\n`;
          mentions.push(participants[i], participants[i + 1]);
        } else {
          msg += `😿 @${participants[i].split('@')[0]} se quedó sin pareja 💔\n`;
          mentions.push(participants[i]);
        }
      }

      msg += `\n${pickRandom(frases)}`;
      await conn.sendMessage(m.chat, { react: { text: '💘', key: m.key } });
      await conn.sendMessage(m.chat, { text: msg, mentions }, { quoted: m });
      return;
    }

    // 💑 Si se menciona a alguien (.match @usuario)
    let mentioned = m.mentionedJid && m.mentionedJid[0];
    if (mentioned) {
      const partner = pickRandom(participants.filter(p => p !== mentioned));
      const msg = `💞 *MATCH ENCONTRADO EN ${groupName}* 💞\n\n@${mentioned.split('@')[0]} ❤️ @${partner.split('@')[0]}\n\n${pickRandom(frases)}`;
      await conn.sendMessage(m.chat, { react: { text: '💘', key: m.key } });
      await conn.sendMessage(m.chat, { text: msg, mentions: [mentioned, partner] }, { quoted: m });
      return;
    }

    // 🐾 Si no hay mención, empareja al autor con otro random
    const author = m.sender;
    const partner = pickRandom(participants.filter(p => p !== author));

    const msg = `💞 *MATCH ALEATORIO EN ${groupName}* 💞\n\n@${author.split('@')[0]} ❤️ @${partner.split('@')[0]}\n\n${pickRandom(frases)}`;

    await conn.sendMessage(m.chat, { react: { text: '💘', key: m.key } });
    await conn.sendMessage(m.chat, { text: msg, mentions: [author, partner] }, { quoted: m });

  } catch (e) {
    console.error(e);
  }
};

// 🔥 Compatibilidad máxima para cualquier loader
handler.help = ['match', 'macht'];
handler.tags = ['fun', 'juego'];
handler.group = true;

// Formato normal
handler.command = ['match', 'macht'];

// Regex alternativo por si el loader lo usa
handler.command = handler.command || /^(match|macht)$/i;

// Permitir alias en loader
handler.customPrefix = null;
handler.register = true;

export default handler;
