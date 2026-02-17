// 📂 plugins/tagall.js — FelixCat-Bot 🐾
// TagAll + Antitagall automático

let handler = async function (m, { conn, groupMetadata, args, isAdmin, isOwner, command }) {
  if (!m.isGroup) return;

  const chatId = m.chat;

  // Inicializar config
  if (!global.db.data.chats[chatId]) global.db.data.chats[chatId] = {};
  const chatData = global.db.data.chats[chatId];

  // =========================
  // 🔥 DETECTOR AUTOMÁTICO
  // =========================

  const text = m.text || '';

  const tagallSignatures = [
    "🔥 Se activó el tag de todos! 🔥",
    "⚡ Usuarios invocados:",
    "💥 Que comience la acción!",
    "tagall-FelixCat"
  ];

  const isTagallMsg = tagallSignatures.some(sig => text.includes(sig));

  // Si alguien copia el tagall y NO es el bot
  if (
    chatData.tagallEnabled &&
    isTagallMsg &&
    !m.key.fromMe // no borrar si es el bot
  ) {
    try {
      await conn.sendMessage(chatId, {
        delete: m.key
      });
    } catch (e) {}
    return;
  }

  // =========================
  // 🔥 Toggle .antitagall
  // =========================

  if (command === 'antitagall') {
    if (!(isAdmin || isOwner)) {
      return conn.sendMessage(chatId, {
        text: '❌ Solo un administrador puede usar este comando.'
      });
    }

    chatData.tagallEnabled = !chatData.tagallEnabled;

    return conn.sendMessage(chatId, {
      text: `⚡ TagAll ahora está ${chatData.tagallEnabled ? 'activado ✅' : 'desactivado ❌'} para este grupo.`
    });
  }

  // =========================
  // TagAll normal
  // =========================

  if (!(isAdmin || isOwner)) {
    return conn.sendMessage(chatId, {
      text: '❌ Solo un administrador puede usar este comando.',
      mentions: [m.sender]
    });
  }

  if (!chatData.tagallEnabled) {
    return conn.sendMessage(chatId, {
      text: '⚠️ El TagAll está desactivado. Usa ".antitagall" para activarlo.'
    });
  }

  const participantes = groupMetadata?.participants || [];
  const mencionados = participantes.map(p => p.id).filter(Boolean);

  const mensajeOpcional = args.length ? args.join(' ') : '';

  const mensaje = [
    `🔥 Se activó el tag de todos! 🔥`,
    `⚡ Usuarios invocados:`,
    mencionados.map(jid => `- @${jid.split('@')[0]}`).join('\n'),
    '💥 Que comience la acción!',
    'https://miunicolink.local/tagall-FelixCat',
    mensajeOpcional
  ].filter(Boolean).join('\n');

  await conn.sendMessage(chatId, {
    text: mensaje,
    mentions: mencionados.concat(m.sender)
  });
};


// =========================
// CONFIG
// =========================

handler.command = ['invocar', 'todos', 'tagall', 'antitagall'];
handler.help = ['tagall', 'antitagall'];
handler.tags = ['grupos'];
handler.group = true;
handler.admin = true;

export default handler;
