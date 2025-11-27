// 📂 plugins/antiestado.js — FelixCat_Bot 🐾
// Anti-Estado: Borra notificaciones de estados y avisa al usuario
// Funciona para todos: users, admins y owners

let handler = async (m, { conn }) => {};

// 🛡 BLOQUEO AUTOMÁTICO DE ESTADOS
export async function before(m, { conn }) {
  const chat = global.db.data.chats[m.chat];
  if (!chat?.antiestado) return false; // No activo → no hace nada

  try {
    // 1) Si viene desde status@broadcast (cuando mencionan grupo en estado)
    if (m.chat === "status@broadcast") {
      await conn.sendMessage(m.chat, { delete: m.key });
      return true;
    }

    const msg = m.msg || m.message || {};
    const type = Object.keys(msg)[0] || "";

    // 2) protocolMessage → notificaciones de estado
    if (type === "protocolMessage") {
      await conn.sendMessage(m.chat, { delete: m.key });
      await conn.reply(
        m.chat,
        `⚠️ @${m.sender.split("@")[0]}, *no está permitido mencionar al grupo desde estados.*`,
        m,
        { mentions: [m.sender] }
      );
      return true;
    }

    // 3) Otros mensajes de estado/evento
    if (type === "status" || type === "eventMessage") {
      await conn.sendMessage(m.chat, { delete: m.key });
      await conn.reply(
        m.chat,
        `⚠️ @${m.sender.split("@")[0]}, *no se permiten notificaciones de estados en este grupo.*`,
        m,
        { mentions: [m.sender] }
      );
      return true;
    }

    // 4) Campos ocultos de estado
    if (msg?.statusMessage || msg?.ephemeralMessage?.message?.statusMessage) {
      await conn.sendMessage(m.chat, { delete: m.key });
      await conn.reply(
        m.chat,
        `⚠️ @${m.sender.split("@")[0]}, *los estados no están permitidos aquí.*`,
        m,
        { mentions: [m.sender] }
      );
      return true;
    }

    return false;
  } catch (e) {
    console.log("[ANTI-ESTADO ERROR]", e);
    return false;
  }
}

// 🔘 COMANDO PARA ACTIVAR/DESACTIVAR
handler.command = /^antiestado$/i;
handler.group = true;
handler.admin = false; // también lo pueden usar usuarios si querés cambiarlo
handler.owner = false;

handler.run = async (m, { conn }) => {
  const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {});

  chat.antiestado = !chat.antiestado; // alternar estado

  m.reply(
    chat.antiestado
      ? "🛡️ *Anti-Estado ACTIVADO*.\nEl bot eliminará notificaciones de estados."
      : "🔕 *Anti-Estado DESACTIVADO*."
  );
};

export default handler; 
