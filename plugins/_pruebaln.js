import { addToBlacklist, removeFromBlacklist, isBlacklisted, getBlacklist } from "../db.js";
import config from "../config.js";

export default {
  command: ["ln", "unln", "ln2", "vln"],
  owner: true,

  run: async ({ conn, m, command, remoteJid, text, isGroup }) => {
    try {
      // =========================
      // MOSTRAR LISTA NEGRA
      // =========================
      if (command === "vln") {
        const entries = getBlacklist();
        if (entries.length === 0) return await conn.sendText(remoteJid, "📋 *No hay usuarios en lista negra.*", m);

        let msg = `🚫 *LISTA NEGRA* (${entries.length} usuario${entries.length > 1 ? 's' : ''})\n\n`;
        entries.forEach((entry, i) => {
          const num = entry.jid.split("@")[0];
          const fecha = new Date(entry.addedAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
          msg += `${i + 1}. @${num}\n   📝 Razón: ${entry.reason}\n   📅 Desde: ${fecha}\n\n`;
        });
        const jids = entries.map(e => e.jid);
        return await conn.sendMessage(remoteJid, { text: msg, mentions: jids }, { quoted: m });
      }

      // =========================
      // LN / UNLN / LN2
      // =========================
      let who, reason;

      // LIMPIAR TEXTO
      let cleanText = text || "";
      if (command === "ln") cleanText = cleanText.replace(/^\.ln\s+/, '').trim();
      else cleanText = cleanText.replace(/^\.(unln|ln2)\s+/, '').trim();

      // Detectar número
      const phoneMatches = cleanText.match(/\+\d[\d\s]*/g);
      if (phoneMatches && phoneMatches.length > 0) {
        const cleanNumber = phoneMatches[0].replace(/\+|\s+/g, "");
        reason = command === "ln" ? cleanText.replace(phoneMatches[0], "").trim() : "";
        who = cleanNumber + "@s.whatsapp.net";

        // Intentar buscar en grupo
        if (isGroup) {
          try {
            const groupMetadata = await conn.groupMetadata(remoteJid);
            const participant = groupMetadata.participants.find(p => p.id.split('@')[0] === cleanNumber);
            if (participant) who = participant.id;
          } catch {}
        }
      } else {
        // Detectar mención
        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        who = mentions[0] || null;

        // Detectar mensaje citado
        if (!who && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
          who = m.message.extendedTextMessage.contextInfo.participant;
        }

        reason = command === "ln" ? cleanText : "";
        if (who) {
          const whoNumber = who.split('@')[0];
          reason = reason.replace(`@${whoNumber}`, "").trim();
        }
      }

      // VALIDACIONES
      if (!who) return await conn.sendText(remoteJid, `⚠️ *Debes mencionar, citar o usar número.*\nEjemplo: .${command} @usuario razón`, m);

      const whoNumber = who.split('@')[0];
      const botNumber = conn.user.jid.split('@')[0];
      const senderNumber = (m.key.participant || m.key.remoteJid).split('@')[0];
      const ownerNumbers = (config.owner || []).map(String);

      if ([botNumber, senderNumber, ...ownerNumbers].includes(whoNumber)) {
        return await conn.sendMessage(remoteJid, { react: { text: '❌', key: m.key } });
      }

      // =========================
      // AGREGAR / QUITAR BLACKLIST
      // =========================
      if (command === "ln") {
        if (!reason) reason = "Sin razón especificada";
        const exists = isBlacklisted(who);
        let realPhoneNumber = whoNumber;

        // Intentar obtener número real en grupo
        if (isGroup) {
          try {
            const groupMetadata = await conn.groupMetadata(remoteJid);
            const participant = groupMetadata.participants.find(p => p.id === who || p.id.split('@')[0] === whoNumber);
            if (participant?.phoneNumber) realPhoneNumber = participant.phoneNumber.split('@')[0];
          } catch {}
        }

        addToBlacklist(who, reason, realPhoneNumber);
        const actionMsg = exists ? `⚠️ *Usuario ya estaba en lista negra*\n✅ Razón actualizada a: ${reason}`
                                 : `🚫 *Usuario agregado a lista negra*\n👤 Usuario: @${whoNumber}\n📝 Razón: ${reason}`;

        await conn.sendMessage(remoteJid, { react: { text: '✅', key: m.key } });
        await conn.sendText(remoteJid, actionMsg, m, { mentions: [who] });

        // Expulsar del grupo si aplica
        if (isGroup) {
          try { await conn.groupParticipantsUpdate(remoteJid, [who], "remove"); } catch {}
        }
      } else {
        // UNLN / LN2
        const allBlacklist = global.db.blacklist || {};
        let exists = null, correctJid = who;

        for (const [jid, entry] of Object.entries(allBlacklist)) {
          const savedNumber = entry.phoneNumber;
          if (jid.split('@')[0] === whoNumber || savedNumber === whoNumber) {
            exists = entry;
            correctJid = jid;
            break;
          }
        }

        if (!exists) return await conn.sendText(remoteJid, "ℹ️ *Ese usuario no está en la lista negra.*", m);

        removeFromBlacklist(correctJid);
        await conn.sendMessage(remoteJid, { react: { text: '☑️', key: m.key } });
        await conn.sendText(remoteJid, `✅ *Usuario removido de lista negra*\n👤 Usuario: +${exists.phoneNumber || whoNumber}`, m);
      }

    } catch (err) {
      console.error('❌ Error en handler lista negra:', err);
      await conn.sendText(remoteJid, '⚠️ *Error al procesar la lista negra.*', m);
    }
  }
}; 
