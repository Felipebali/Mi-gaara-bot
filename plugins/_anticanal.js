// 📂 plugins/anticanal.js — Anti canales WhatsApp ✔
// Compatible con la estructura de tu antilink.js

const owners = ['59896026646', '59898719147', '59892363485'];

// Detecta TODOS los links de canal WhatsApp
const canalRegex = /whatsapp\.com\/channel\/[0-9A-Za-z_-]+/i;

let handler = async (m, { conn, isAdmin, command }) => {
  if (command === "anticanal") {
    if (!isAdmin) return m.reply("❌ Solo admins pueden activar o desactivar Anti-Canal.");

    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};

    let chat = global.db.data.chats[m.chat];
    chat.anticanal = !chat.anticanal;

    return m.reply(`📢 Anti-Canal *${chat.anticanal ? "ACTIVADO" : "DESACTIVADO"}*`);
  }
};

export async function before(m, { conn, isAdmin, isBotAdmin }) {
  if (!m.isGroup) return true;
  if (!global.db?.data?.chats[m.chat]) global.db.data.chats[m.chat] = {};

  const chat = global.db.data.chats[m.chat];
  if (!chat.anticanal) return true;

  if (!m.message) return true;

  // Extrae texto igual que tu antilink.js
  const text =
    m.text ||
    m.message.conversation ||
    m.message.extendedTextMessage?.text ||
    m.message.caption ||
    '';

  if (!text) return true;

  // Si NO es canal → ignorar
  if (!canalRegex.test(text)) return true;

  const who = m.sender;
  const number = who.replace(/\D/g, '');

  // Dueños exentos
  if (owners.includes(number)) return true;

  // Si bot no es admin no puede borrar
  if (!isBotAdmin) {
    await conn.sendMessage(m.chat, { text: "⚠️ Hay un link de canal, pero no soy admin para borrarlo." });
    return false;
  }

  // ---- BORRAR MENSAJE igual que tu ANTI-LINK ----
  async function deleteMessageSafe() {
    try {
      const deleteKey = {
        remoteJid: m.chat,
        fromMe: m.key.fromMe,
        id: m.key.id,
        participant: m.key.participant || m.participant || m.sender,
      };
      await conn.sendMessage(m.chat, { delete: deleteKey });
    } catch (e) {}
  }

  await deleteMessageSafe();

  // Aviso
  await conn.sendMessage(m.chat, {
    text: `🚫 Enlace de *canal* eliminado.\n@${who.split("@")[0]}`,
    mentions: [who],
  });

  // Expulsar si no es admin
  if (!isAdmin) {
    try {
      await conn.groupParticipantsUpdate(m.chat, [m.sender], "remove");
    } catch {}
  }

  return false;
}

handler.command = ["anticanal"];
export default handler;
