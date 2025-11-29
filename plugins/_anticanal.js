// 📂 plugins/anticanal.js — FelixCat_Bot 🐾

// 🔹 Detecta enlaces de canales
const channelLinkRegex = /whatsapp\.com\/channel\/[0-9A-Za-z]+/i;

// 🔹 Dueños (exentos del filtro)
const owners = ['59896026646', '59898719147', '59892363485'];

export async function before(m, { conn, isAdmin, isBotAdmin }) {

  if (!m.isGroup) return;
  if (!m.message) return;

  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {});
  if (!chat.anticanal) return; // Si no está activado, no hace nada

  const text = m.text || '';
  const sender = m.sender.replace(/[^0-9]/g, '');

  // Exentos → owners y el propio bot
  const botNumber = conn.user?.id.split(':')[0];
  if (owners.includes(sender) || sender === botNumber) return;

  // ❌ Si detecta enlace de canal
  if (channelLinkRegex.test(text)) {

    // Si el bot no es admin → solo avisa
    if (!isBotAdmin) {
      return conn.reply(m.chat, "⚠️ Detecté un enlace de *canal*, pero no soy admin para borrarlo.", m);
    }

    // 🧹 Borra el mensaje
    await conn.sendMessage(m.chat, { delete: m.key });

    // ⚠️ Advierte
    await conn.reply(
      m.chat,
      `🚫 *Enlace de canal detectado*\n@${sender} no se permite compartir canales de WhatsApp.`,
      m,
      { mentions: [m.sender] }
    );

    // Si el que lo envió NO es admin → expulsión 🔥
    if (!isAdmin) {
      await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
    }

    return false;
  }

  return;
}

// ------------------------------
// Comando para activar/desactivar
// ------------------------------
let handler = async (m, { conn, isAdmin, command }) => {

  if (!m.isGroup) return m.reply("❌ Solo en grupos.");
  if (!isAdmin) return m.reply("❌ Solo admins pueden activar o desactivar el Anti-Canal.");

  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {});
  chat.anticanal = !chat.anticanal;

  m.reply(
    `📡 Anti-Canal *${chat.anticanal ? "ACTIVADO" : "DESACTIVADO"}*\n` +
    `Los enlaces de canales ahora ${chat.anticanal ? "serán bloqueados." : "ya no serán filtrados."}`
  );
};

handler.help = ['anticanal'];
handler.tags = ['grupo'];
handler.command = ['anticanal'];

export default handler;
