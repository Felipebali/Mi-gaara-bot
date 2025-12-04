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

let plugin = {};

plugin.groupParticipantsUpdate = async function (m, { client, isBotAdmin }) {
  try {
    if (!isBotAdmin) return;
    if (!m.isGroup) return;

    const db = readDB();

    for (let user of m.participants) {
      const entry = db.find(u => u.jid === user);
      if (!entry) continue;

      await client.groupParticipantsUpdate(m.chat, [user], "remove");

      await client.sendText(
        m.chat,
        txt.blackList(user, entry.reason),
        null,
        { mentions: [user] }
      );
    }

  } catch (e) {
    console.error("Error autokick join blacklist:", e);
  }
};

export default plugin;
