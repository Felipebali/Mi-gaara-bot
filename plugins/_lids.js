import fs from "fs"
import path from "path"
import { getUser, saveUser } from "../databaseFunctions.js"

// ==========================
// 🧰 Infraestructura segura
// ==========================
const DB_DIR = "./database"
const USERS_FILE = path.join(DB_DIR, "users.json")

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "{}")

// ==========================
// 🧠 Handler
// ==========================
let handler = async (m, { conn, text, usedPrefix, command }) => {
  let who, whoData, whoLid, whoJid, whoPushName

  const numberMatches = text.match(/@[0-9\s]+/g)
  const numberMatchesPlus = text.match(/\+[0-9\s]+/g)

  if (numberMatchesPlus?.length) {
    who = numberMatchesPlus[0].replace(/[+\s]/g, "") + "@s.whatsapp.net"
  } 
  else if (numberMatches?.length) {
    who = numberMatches[0].replace("@", "").replace(/\s+/g, "") + "@lid"
  } 
  else if (m.quoted) {
    who = m.quoted.sender
  }

  if (!who) {
    return conn.sendMessage(
      m.chat,
      { text: `Uso correcto:\n${usedPrefix + command} @usuario\n${usedPrefix + command} +598xxxxxxxx` },
      { quoted: m }
    )
  }

  whoPushName = await conn.getName(who)
  whoData = getUser(who) || {}

  // 🧾 Auto-registrar usuario si no existe
  if (!whoData || Object.keys(whoData).length === 0) {
    saveUser(who, {
      jid: who.endsWith("@s.whatsapp.net") ? who : "",
      lid: who.endsWith("@lid") ? who : "",
      pushName: whoPushName
    })
    whoData = getUser(who)
  }

  whoLid = whoData.lid || "No registrado"
  whoJid = whoData.jid || "No registrado"

  const txt = `
🧾 *Información del usuario*

👤 Usuario: +${whoJid.replace(/@.*/, "")}
📛 Nombre actual: ${whoPushName}

🆔 LID: ${whoLid}

💬 Chat actual: ${m.chat}
`.trim()

  await conn.sendMessage(m.chat, { text: txt }, { quoted: m })
}

handler.command = ["lid"]
handler.owner = true

export default handler
