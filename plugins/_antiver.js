// ============================
//  ANTI-VER UNA VEZ (TOGGLE)
//  Solo fotos y videos normales
// ============================

let handler = async (m, { conn, isBotAdmin }) => {
  const chatId = m.chat;

  if (!m.isGroup)
    return conn.reply(chatId, "❌ Este comando solo funciona en grupos.", m);

  if (!isBotAdmin)
    return conn.reply(chatId, "❗ Necesito ser administrador para activar/desactivar AntiVer.", m);

  // Inicializar DB
  global.db = global.db || {};
  global.db.chats = global.db.chats || {};
  global.db.chats[chatId] = global.db.chats[chatId] || {};

  // Alternar estado (toggle)
  const current = global.db.chats[chatId].antiver || false;
  const newState = !current;

  global.db.chats[chatId].antiver = newState;

  if (newState) {
    conn.reply(chatId, "🟢 *AntiVer ACTIVADO*\nSolo se permiten fotos y videos *ver una vez*.", m);
  } else {
    conn.reply(chatId, "🔴 *AntiVer DESACTIVADO*\nSe permiten fotos y videos normales.", m);
  }
};


// ============================
//   FILTRADO AUTOMÁTICO
// ============================
handler.before = async function (m, { conn, isBotAdmin }) {
  try {
    if (!m.isGroup) return;
    if (!isBotAdmin) return;

    const chatId = m.chat;

    // DB
    global.db = global.db || {};
    global.db.chats = global.db.chats || {};
    global.db.chats[chatId] = global.db.chats[chatId] || {};

    // Si no está activado → no filtrar
    if (!global.db.chats[chatId].antiver) return;

    const msg = m.msg || m.message;
    if (!msg) return;

    // ---------------------
    //   Ver una vez
    // ---------------------
    const isViewOnce =
      msg.viewOnceMessage ||
      msg.viewOnceMessageV2 ||
      msg.viewOnceMessageV2Extension;

    if (isViewOnce) return; // PERMITIDO

    // ---------------------------
    //   SOLO FOTO / VIDEO
    // ---------------------------
    const isPhotoNormal = msg.imageMessage && !isViewOnce;
    const isVideoNormal = msg.videoMessage && !isViewOnce;

    // NO borrar audios, stickers, docs
    if (isPhotoNormal || isVideoNormal) {
      // Borrar
      await conn.sendMessage(chatId, {
        delete: {
          remoteJid: chatId,
          fromMe: false,
          id: m.key.id,
          participant: m.sender
        }
      });

      await conn.sendMessage(chatId, {
        text: "🧹 *Borrado por AntiVer*\nSolo se permiten fotos y videos *ver una vez*."
      });
    }

  } catch (e) {
    console.error("ERROR ANTIVER:", e);
  }
};


handler.command = /^antiver$/i;

export default handler;
