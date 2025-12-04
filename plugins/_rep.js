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

function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
}

let handler = async (m, { client, text, usedPrefix, command }) => {

  // ✅ VER LISTA
  if (command === "vre") {
    const entries = readDB()

    if (!entries.length) {
      return await client.sendMessage(
        m.chat,
        { text: "✅ No hay usuarios en lista negra." },
        { quoted: m }
      )
    }

    let msg = entries.map((entry, i) => {
      const num = `+${entry.jid.split("@")[0]}`
      return `${i + 1}. ${num}\nMotivo: ${entry.reason}`
    }).join("\n\n")

    const jids = entries.map(e => e.jid)

    return await client.sendMessage(
      m.chat,
      { text: msg, mentions: jids },
      { quoted: m }
    )
  }

  // ✅ OBTENER USUARIO
  let who, reason
  const phoneMatches = text?.match(/\+\d[\d\s]*/g)

  if (phoneMatches?.length) {
    who = phoneMatches[0].replace(/\+|\s+/g, "") + "@s.whatsapp.net"
    reason = text.replace(phoneMatches[0], "").trim()
  } else {
    who = m.mentionedJid?.[0] || m.quoted?.sender || null
    reason = text?.trim()
  }

  if (!who)
    return await client.sendMessage(
      m.chat,
      { text: `Uso correcto:\n${usedPrefix + command} @usuario motivo` },
      { quoted: m }
    )

  if (who === m.sender) return m.react("❌")

  const ownerJids = (globalThis.owners || []).map(o => o + "@s.whatsapp.net")
  if (ownerJids.includes(who)) return m.react("❌")

  let db = readDB()
  const index = db.findIndex(u => u.jid === who)

  // ✅ AGREGAR BLACKLIST
  if (command === "re") {
    if (index !== -1) {
      db[index].reason = reason || "Sin motivo"
    } else {
      db.push({ jid: who, reason: reason || "Sin motivo" })
    }

    writeDB(db)

    if (m.isGroup) {
      await client.groupParticipantsUpdate(m.chat, [who], "remove")
    }

    return m.react("✅")
  }

  // ✅ QUITAR BLACKLIST
  if (command === "re2") {
    if (index === -1)
      return await client.sendMessage(
        m.chat,
        { text: "Ese usuario no estaba en la lista negra." },
        { quoted: m }
      )

    db.splice(index, 1)
    writeDB(db)

    return m.react("☑️")
  }
}

handler.command = ["re", "re2", "vre"]
handler.owner = true

export default handler
