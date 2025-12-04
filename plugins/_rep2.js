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

let plugin = (m) => m;

plugin.before = async function (m, { client, isBotAdmin, isRAdmin }) {
  try {
    if (isRAdmin) return;
    if (!isBotAdmin) return;
    if (!m.isGroup) return;
    if (m.messageStubType) return;

    const sender = m.sender;
    const db = readDB();
    const entry = db.find(u => u.jid === sender);
    if (!entry) return;

    await m.delete();
    await client.groupParticipantsUpdate(m.chat, [sender], "remove");

    await client.sendText(
      m.chat,
      txt.blackList(sender, entry.reason),
      null,
      { mentions: [sender] }
    );

    return true;
  } catch (e) {
    console.error("Error autokick blacklist:", e);
  }
};

export default plugin;
