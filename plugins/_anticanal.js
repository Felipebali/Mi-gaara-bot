// 📂 plugins/anticanal.js — Anti-canal WhatsApp (mejorado)
// Borra links de canales y mantiene comando para activar/desactivar

const owners = ['59896026646', '59898719147', '59892363485'];

// Regex que detecta todos los formatos de canal (con o sin www, http/https, params)
const canalRegex = /(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/[A-Za-z0-9_-]+(?:\?[^\s]+)?/i;

let handler = async (m, { conn, isAdmin, isBotAdmin, command }) => {
  // ACTIVAR / DESACTIVAR
  if (command === "anticanal") {
    if (!isAdmin) return m.reply("❌ Solo *admins* pueden activar o desactivar Anti-Canal.");

    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};

    let chat = global.db.data.chats[m.chat];
    chat.anticanal = !chat.anticanal;

    return m.reply(`📢 Anti-Canal *${chat.anticanal ? "ACTIVADO" : "DESACTIVADO"}*`);
  }
};

export async function before(m, { conn, isAdmin, isBotAdmin }) {
  try {
    if (!m.isGroup) return true;
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};

    const chat = global.db.data.chats[m.chat];
    if (!chat.anticanal) return true;

    // --- EXTRAER TEXTO de todas las posibles ubicaciones ---
    const text =
      m.text ||
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      m.message?.ephemeralMessage?.message?.extendedTextMessage?.text ||
      m.message?.imageMessage?.caption ||
      m.message?.videoMessage?.caption ||
      m.message?.documentMessage?.caption ||
      m.message?.buttonsResponseMessage?.selectedButtonId ||
      m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      m.message?.caption ||
      '';

    if (!text) return true;

    // Si no es link de canal → ignorar
    if (!canalRegex.test(text)) return true;

    const sender = m.sender.replace(/[^0-9]/g, '');
    const isOwner = owners.includes(sender);

    // Owners exentos
    if (isOwner) return true;

    // Si el bot no es admin → solo avisa
    if (!isBotAdmin) {
      await conn.sendMessage(m.chat, { text: "⚠️ Hay un link de *canal*, pero no soy admin para borrarlo." });
      return false;
    }

    // deleteMessageSafe — usa la misma estructura que tu antilink
    async function deleteMessageSafe() {
      try {
        const deleteKey = {
          remoteJid: m.chat,
          fromMe: m.key?.fromMe || false,
          id: m.key?.id || (m.message?.contextInfo && m.message.contextInfo.stanzaId) || undefined,
          participant: m.key?.participant || m.participant || m.sender,
        };
        // Si no existe id exacta, intenta fallback: eliminar por key completo (algunas versiones aceptan m.key)
        if (deleteKey.id) {
          await conn.sendMessage(m.chat, { delete: deleteKey });
        } else {
          // fallback seguro
          await conn.sendMessage(m.chat, { delete: m.key });
        }
      } catch (e) {
        // no rompas el flow
      }
    }

    // Borrar mensaje
    await deleteMessageSafe();

    // Aviso público (mencionando)
    try {
      await conn.sendMessage(m.chat, {
        text: `🚫 *Enlace de canal eliminado*\n@${sender} no se permite compartir canales aquí.`,
        mentions: [m.sender],
      });
    } catch {}

    // Expulsar si NO es admin (opcional: si no querés expulsar, comenta el bloque siguiente)
    if (!isAdmin) {
      try {
        await conn.groupParticipantsUpdate(m.chat, [m.sender], "remove");
      } catch {}
    }

    return false;
  } catch (err) {
    // si algo falla no rompas otros plugins
    return true;
  }
}

handler.command = ["anticanal"];
export default handler;
