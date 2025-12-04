import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "database", "blacklist.json");

function ensureDB() {
  if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([]));
  }
}

function readDB() {
  ensureDB();
  return JSON.parse(fs.readFileSync(dbPath));
}

function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

let plugin = {};
plugin.cmd = ["re", "re2", "vre"];
plugin.onlyOwner = true;

plugin.run = async (m, { client, text, usedPrefix, command }) => {

  // ✅ VER LISTA
  if (command === "vre") {
    const entries = readDB();

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

  if (!who)
    return client.sendText(m.chat, txt.defaultWhoBlackList(usedPrefix, command), m);

  if (who === client.user.jid || who === m.sender) return m.react("❌");

  const ownerJids = (globalThis.owners || []).map(o => o + "@s.whatsapp.net");
  if (ownerJids.includes(who)) return m.react("❌");

  let db = readDB();
  const index = db.findIndex(u => u.jid === who);

  // ✅ AGREGAR
  if (command === "re") {
    if (index !== -1) {
      db[index].reason = reason || "Sin motivo";
    } else {
      db.push({ jid: who, reason: reason || "Sin motivo" });
    }

    writeDB(db);

    if (m.isGroup)
      await client.groupParticipantsUpdate(m.chat, [who], "remove");

    return m.react("✅");
  }

  // ✅ QUITAR
  if (command === "re2") {
    if (index === -1)
      return client.sendText(m.chat, "Ese usuario no estaba en la lista negra.", m);

    db.splice(index, 1);
    writeDB(db);
    return m.react("☑️");
  }
};

export default plugin;
