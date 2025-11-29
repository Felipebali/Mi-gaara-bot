function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim();
}

// Regex para links de canal de WhatsApp
const canalRegex = /(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/[0-9A-Za-z_-]+/i;

export default {
  command: ["anticanal"],
  admin: true,

  // =========================================================
  // 🔧 ACTIVAR / DESACTIVAR
  // =========================================================
  run: async ({ conn, m, remoteJid, senderJid, isGroup, isAdmin }) => {
    try {
      if (!isGroup)
        return await conn.sendText(remoteJid, "❌ Este comando solo funciona en grupos.", m);

      if (!isAdmin)
        return await conn.sendText(remoteJid, "🛡️ Solo administradores pueden usar este comando.", m, {
          mentions: [senderJid],
        });

      if (!global.db.data.chats) global.db.data.chats = {};
      if (!global.db.data.chats[remoteJid])
        global.db.data.chats[remoteJid] = { antilink: true, anticanal: true };

      const current = global.db.data.chats[remoteJid].anticanal;
      const newState = !current;

      global.db.data.chats[remoteJid].anticanal = newState;
      await global.db.write();

      // reacción ✔/❌
      await conn.sendMessage(remoteJid, {
        react: { text: newState ? "🟢" : "🔴", key: m.key },
      });

      // mensaje
      await conn.sendText(
        remoteJid,
        `📢 *Anticanal ${newState ? "ACTIVADO" : "DESACTIVADO"}*`,
        m
      );
    } catch (err) {
      console.error("❌ Error en anticanal:", err);
    }
  },

  // =========================================================
  // BEFORE → DETECTA LINKS DE CANAL Y CONTENIDO REENVIADO
  // =========================================================
  before: async ({ conn, m, remoteJid, senderJid, isGroup, isAdmin, isBotAdmin }) => {
    try {
      if (!isGroup) return;
      if (!global.db.data.chats[remoteJid]) return;

      const chat = global.db.data.chats[remoteJid];
      if (!chat.anticanal) return;

      const num = cleanNum(senderJid);
      const mention = senderJid;

      const text =
        m.text ||
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.caption ||
        "";

      // =====================================================
      // 🔍 1) DETECTAR LINKS DE CANAL
      // =====================================================
      if (canalRegex.test(text)) {

        if (!isBotAdmin)
          return await conn.sendText(remoteJid, "⚠️ Hay un link de canal, pero no soy admin.");

        // borrar mensaje
        await conn.sendMessage(remoteJid, {
          delete: {
            remoteJid,
            fromMe: false,
            id: m.key.id,
            participant: m.key.participant || senderJid,
          },
        });

        await conn.sendText(remoteJid, `🚫 Link de canal eliminado.`, null, {
          mentions: [mention],
        });

        if (!isAdmin) {
          await conn.groupParticipantsUpdate(remoteJid, [senderJid], "remove");
        }

        return false;
      }

      // =====================================================
      // 🔍 2) DETECTAR REENVÍO DESDE CANALES (newsletter)
      // =====================================================
      const forwarded = m.message?.extendedTextMessage?.contextInfo?.isForwarded;
      const fromNewsletter =
        m.message?.extendedTextMessage?.contextInfo?.forwardedNewsletterMessageInfo;

      if (forwarded && fromNewsletter) {
        if (!isBotAdmin)
          return await conn.sendText(remoteJid, "⚠️ Contenido de canal detectado, pero no soy admin.");

        // borrar mensaje
        await conn.sendMessage(remoteJid, {
          delete: {
            remoteJid,
            fromMe: false,
            id: m.key.id,
            participant: m.key.participant || senderJid,
          },
        });

        await conn.sendText(
          remoteJid,
          `📱 @${num} compartió contenido de canal.`,
          null,
          { mentions: [mention] }
        );

        if (!isAdmin) {
          await conn.groupParticipantsUpdate(remoteJid, [senderJid], "remove");
        }

        return false;
      }
    } catch (err) {
      console.error("❌ Error en before de anticanal:", err);
    }
  },
};
