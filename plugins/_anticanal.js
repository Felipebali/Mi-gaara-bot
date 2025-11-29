// 📂 plugins/anticanal.js — FelixCat_Bot 🐾

// 🔹 Detecta enlaces de canales (todos los formatos reales)
const channelLinkRegex = /https?:\/\/(www\.)?whatsapp\.com\/channel\/[0-9A-Za-z]{20,32}/i;

// 🔹 Dueños (exentos del filtro)
const owners = ['59896026646', '59898719147', '59892363485'];

export async function before(m, { conn, isAdmin, isBotAdmin }) {

  if (!m.isGroup) return;
  if (!m.message) return;

  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {});
  if (!chat.anticanal) return;

  const text = m.text || '';
  const sender = m.sender.replace(/[^0-9]/g, '');

  const botNumber = conn.user?.id.split(':')[0];
  if (owners.includes(sender) || sender === botNumber) return;

  // 🔹 Detecta canal ✔
  const isChannel = channelLinkRegex.test(text);

  if (isChannel) {

    // ✔ No bot admin → solo avisa
    if (!isBotAdmin) {
      return conn.reply(m.chat, "⚠️ Detecté un enlace de *canal*, pero no soy admin para borrarlo.");
    }

    // ✔ Borra el mensaje del canal
    await conn.sendMessage(m.chat, { delete: m.key });

    // ✔ Aviso en chat (sin expulsión)
    await conn.sendMessage(
      m.chat,
      {
        text: `🚫 *Enlace de canal detectado*\n@${sender} no se permite compartir canales de WhatsApp.`,
        mentions: [m.sender]
      }
    );

    // ❌ YA NO EXPULSA  
    return false;
  }

  return;
}

// ------------------------------
// Comando activación/desactivación SIN RESPUESTA CITADA
// ------------------------------

let handler = async (m, { conn, isAdmin }) => {

  if (!m.isGroup)
    return conn.sendMessage(m.chat, { text: "❌ Solo en grupos." });

  if (!isAdmin)
    return conn.sendMessage(m.chat, { text: "❌ Solo admins pueden activar o desactivar el Anti-Canal." });

  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {});
  chat.anticanal = !chat.anticanal;

  await conn.sendMessage(m.chat, {
    text:
      `📡 Anti-Canal *${chat.anticanal ? "ACTIVADO" : "DESACTIVADO"}*\n` +
      `Los enlaces de canales ahora ` +
      `${chat.anticanal ? "serán bloqueados (solo borrado, sin expulsar)." : "ya no serán filtrados."}`
  });
};

handler.help = ['anticanal'];
handler.tags = ['grupo'];
handler.command = ['anticanal'];

export default handler;
