import { addToBlacklist, removeFromBlacklist, getBlacklist, isBlacklisted, getUser } from "../databaseFunctions.js";

let plugin = {};
plugin.cmd = ["re", "re2", "vre"];
plugin.onlyOwner = true;

plugin.run = async (m, { client, text, usedPrefix, command }) => {

  // ✅ VER LISTA NEGRA
  if (command === "vre") {
    const entries = getBlacklist();

    if (!entries.length) 
      return client.sendText(m.chat, "No hay usuarios en lista negra.", m);

    let msg = entries.map((entry, i) => {
      const num = `+${entry.jid.split("@")[0]}`;
      return `${i + 1}. ${num}\nRazón: ${entry.reason}`;
    }).join("\n\n");

    const jids = entries.map(e => e.jid);
    return client.sendMessage(m.chat, { text: msg, mentions: jids }, { quoted: m });
  }

  // ✅ OBTENER USUARIO
  let who, reason;
  const phoneMatches = text.match(/\+\d[\d\s]*/g);

  if (phoneMatches?.length) {
    who = phoneMatches[0].replace(/\+|\s+/g, "") + "@s.whatsapp.net";
    reason = text.replace(phoneMatches[0], "").trim();
  } else {
    who = m.mentionedJid?.[0] || m.quoted?.sender || null;
    reason = text.trim();
  }

  // ✅ LID → JID
  if (who?.endsWith("@lid")) {
    const whoData = getUser(who);
    who = whoData?.jid;
  }

  if (!who) 
    return client.sendText(m.chat, txt.defaultWhoBlackList(usedPrefix, command), m);

  if (who === client.user.jid || who === m.sender) return m.react("❌");

  if (command === "re" && !reason) 
    return client.sendText(m.chat, txt.blistRejectNullReason, m);

  // ✅ PROTEGER OWNERS
  const ownerJids = (globalThis.owners || []).map(o => o + "@s.whatsapp.net");
  if (ownerJids.includes(who)) return m.react("❌");

  const exists = isBlacklisted(who);

  // ✅ AGREGAR
  if (command === "re") {
    addToBlacklist(who, reason || "Sin motivo");

    if (m.isGroup)
      await client.groupParticipantsUpdate(m.chat, [who], "remove");

    return m.react("✅");
  }

  // ✅ QUITAR
  if (command === "re2") {
    if (!exists)
      return client.sendText(m.chat, "Ese usuario no estaba en la lista negra.", m);

    removeFromBlacklist(who);
    return m.react("☑️");
  }
};

export default plugin;
