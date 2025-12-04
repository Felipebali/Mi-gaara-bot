import fs from "fs"
import path from "path"

const dbPath = path.join(process.cwd(), "database", "blacklist.json")

function ensureDB() {
  if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([]))
  }
}

function readDB() {
  ensureDB()
  return JSON.parse(fs.readFileSync(dbPath))
}

let handler = async (m, { client, isBotAdmin }) => {
  if (!isBotAdmin) return
  if (!m.isGroup) return
  if (!m.participants?.length) return

  const db = readDB()

  for (let user of m.participants) {
    const entry = db.find(u => u.jid === user)
    if (!entry) continue

    await client.groupParticipantsUpdate(m.chat, [user], "remove")

    await client.sendMessage(
      m.chat,
      {
        text: `🚫 Usuario en lista negra\n@${user.split("@")[0]}\nMotivo: ${entry.reason}`,
        mentions: [user]
      }
    )
  }
}

handler.group = true
handler.register = true

export default handler
