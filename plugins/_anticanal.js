// 📂 plugins/anticanal.js — FelixCat_Bot 🐾

// 🔹 Detecta enlaces de canales de WhatsApp
const channelRegex = /(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/[0-9A-Za-z]{20,32}/i;

// 🔹 Owners exentos (igual que en antilink)
const owners = ['59896026646', '59898719147', '59892363485'];

export async function before(m, { conn, isAdmin, isBotAdmin }) {
  if (!m.isGroup) return true;
  if (!m.message) return true;

  const chat = global.db.data.chats[m.chat];
  if (!chat?.antiCanal) return true;

  const text =
    m.text ||
    m.message.conversation ||
    m.message.extendedTextMessage?.text ||
    m.message.caption ||
    '';

  if (!text) return true;

  const who = m.sender;
  const number = who.replace(/\D/g, '');

  const isChannel = channelRegex.test(text);

  async function deleteMessageSafe() {
    try {
      const deleteKey = {
        remoteJid: m.chat,
        fromMe: m.key.fromMe,
        id: m.key.id,
        participant: m.key.participant || m.participant || m.sender,
      };
      await conn.sendMessage(m.chat, { delete: deleteKey });
    } catch { }
  }

  // 🔹 Owners exentos, igual que en antilink
  if (owners.includes(number)) return true;

  // 🔹 Admins no son expulsados ni bloqueados
  if (isChannel) {

    // Si bot NO es admin → no puede borrar
    if (!isBotAdmin) {
      await conn.sendMessage(m.chat, {
        text: `⚠️ Detecté un *link de canal*, pero no soy admin para borrarlo.`,
      });
      return false;
    }

    // ✔ Borrar link del canal
    await deleteMessageSafe();

    // ✔ Aviso
    await conn.sendMessage(m.chat, {
      text: `🚫 *Enlace de canal eliminado*\n@${who.split('@')[0]} no se permite compartir canales aquí.`,
      mentions: [who],
    });

    return false;
  }

  return true;
}

// ------------------------------
// Comando ON / OFF igual que en antilink
// ------------------------------

let handler = async (m, { conn, isAdmin }) => {

  if (!m.isGroup)
    return conn.sendMessage(m.chat, { text: "❌ Solo en grupos." });

  if (!isAdmin)
    return conn.sendMessage(m.chat, { text: "❌ Solo admins pueden usar este comando." });

  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {});

  chat.antiCanal = !chat.antiCanal;

  await conn.sendMessage(m.chat, {
    text:
      `📡 Anti-Canal *${chat.antiCanal ? "ACTIVADO" : "DESACTIVADO"}*\n` +
      `Los enlaces de canales ahora ` +
      `${chat.antiCanal ? "serán eliminados." : "ya no serán filtrados."}`
  });
};

handler.help = ['anticanal'];
handler.tags = ['grupo'];
handler.command = ['anticanal'];

export default handler;
