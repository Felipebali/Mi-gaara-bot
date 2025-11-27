// 📂 plugins/antiestado.js — FelixCat_Bot 🐾
// Anti-Estado: bloquea notificaciones de estados y menciones de grupo desde estados

// 🔹 Dueños (NO exentos en este antiestado, borra también a owners)
const owners = ['59896026646', '59898719147', '59892363485'];

export async function before(m, { conn }) {
  if (!m.isGroup) return true;
  if (!m.message) return true;

  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {});

  // Si no está activado → no hace nada
  if (!chat.antiestado) return true;

  const who = m.sender;
  const number = who.replace(/\D/g, '');

  const msg = m.msg || m.message || {};
  const type = Object.keys(msg)[0] || "";

  // Función segura para eliminar mensaje
  async function deleteMessageSafe() {
    try {
      const deleteKey = {
        remoteJid: m.chat,
        fromMe: m.key.fromMe,
        id: m.key.id,
        participant: m.key.participant || m.participant || m.sender,
      };
      await conn.sendMessage(m.chat, { delete: deleteKey });
    } catch {}
  }

  // 1) status@broadcast => cuando mencionan al grupo en Estado
  if (m.chat === "status@broadcast") {
    await deleteMessageSafe();
    await conn.sendMessage(m.chat, {
      text: `⚠️ @${who.split('@')[0]}, *no se permiten estados mencionando al grupo.*`,
      mentions: [who],
    });
    return false;
  }

  // 2) protocolMessage → muchas notificaciones de Estado usan este tipo
  if (type === "protocolMessage") {
    await deleteMessageSafe();
    await conn.sendMessage(m.chat, {
      text: `⚠️ @${who.split('@')[0]}, *está prohibido mencionar al grupo desde un estado.*`,
      mentions: [who],
    });
    return false;
  }

  // 3) eventMessage o status → otras formas de estados
  if (type === "eventMessage" || type === "status") {
    await deleteMessageSafe();
    await conn.sendMessage(m.chat, {
      text: `⚠️ @${who.split('@')[0]}, *las notificaciones de estado no están permitidas.*`,
      mentions: [who],
    });
    return false;
  }

  // 4) statusMessage oculto dentro de ephemeralMessage
  if (msg?.statusMessage || msg?.ephemeralMessage?.message?.statusMessage) {
    await deleteMessageSafe();
    await conn.sendMessage(m.chat, {
      text: `⚠️ @${who.split('@')[0]}, *los estados no están permitidos dentro del grupo.*`,
      mentions: [who],
    });
    return false;
  }

  return true;
}

// 🔘 Comando para activar/desactivar
let handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply("❌ Este comando solo funciona en grupos.");
  
  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {});
  
  chat.antiestado = !chat.antiestado;

  m.reply(
    chat.antiestado
      ? "🛡️ *Anti-Estado ACTIVADO*.\nSe eliminarán notificaciones de estados."
      : "🔕 *Anti-Estado DESACTIVADO*."
  );
};

handler.command = /^antiestado$/i;
handler.group = true;
handler.admin = false; 
handler.owner = false;

export default handler;
