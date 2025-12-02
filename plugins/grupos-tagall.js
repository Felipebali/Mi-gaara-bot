// 📂 plugins/tagall.js — FelixCat-Bot 🐾
// TagAll con toggle .antitagall ON/OFF

let handler = async function (m, { conn, groupMetadata, args, isAdmin, isOwner, command }) {
  if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos.');

  const chatId = m.chat;

  // Inicializar la configuración si no existe
  if (!global.db.data.chats[chatId]) global.db.data.chats[chatId] = {};
  const chatData = global.db.data.chats[chatId];

  // 🔥 Toggle .antitagall — SOLO ADMIN / OWNER
  if (command === 'antitagall') {
    if (!(isAdmin || isOwner)) {
      return m.reply('❌ Solo un administrador puede usar este comando.');
    }

    chatData.tagallEnabled = !chatData.tagallEnabled;
    return m.reply(`⚡ TagAll ahora está ${chatData.tagallEnabled ? 'activado ✅' : 'desactivado ❌'} para este grupo.`);
  }

  // ===========================
  // TagAll normal (.tagall / .invocar / .todos)
  // ===========================

  // Validar permisos
  if (!(isAdmin || isOwner)) {
    await conn.sendMessage(m.chat, {
      text: '❌ Solo un administrador puede usar este comando.',
      mentions: [m.sender]
    });
    throw false;
  }

  // Verificar si TagAll está activado
  if (!chatData.tagallEnabled) {
    return m.reply('⚠️ El TagAll está desactivado. Usa ".antitagall" para activarlo.');
  }

  const participantes = groupMetadata?.participants || [];
  const mencionados = participantes.map(p => p.id).filter(Boolean);

  const mensajeOpcional = args.length ? args.join(' ') : '⚡ Sin mensaje extra.';

  const mensaje = [
    `🔥 Se activó el tag de todos! 🔥`,
    `⚡ Usuarios invocados:`,
    mencionados.map(jid => `- @${jid.split('@')[0]}`).join('\n'),
    '💥 Que comience la acción!',
    'https://miunicolink.local/tagall-FelixCat',
    mensajeOpcional
  ].join('\n');

  await conn.sendMessage(m.chat, {
    text: mensaje,
    mentions: mencionados.concat(m.sender)
  });
};

// Comandos
handler.command = ['invocar', 'todos', 'tagall', 'antitagall'];
handler.help = ['tagall / .antitagall (toggle)'];
handler.tags = ['grupos'];
handler.group = true;
handler.admin = true;

export default handler;
