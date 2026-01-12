import fs from "fs"
import path from "path"
import { getUser, saveUser } from "../databaseFunctions.js"

// 🧰 Infraestructura segura
const DB_DIR = "./database"
const USERS_FILE = path.join(DB_DIR, "users.json")
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "{}")

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let who, whoData, whoJid, whoLid, whoPushName

  const numberMatchesPlus = text.match(/\+[0-9\s]+/g)
  const numberMatches = text.match(/@[0-9\s]+/g)

  if (numberMatchesPlus?.length) {
    // Usuario con JID
    who = numberMatchesPlus[0].replace(/[+\s]/g, "") + "@s.whatsapp.net"
  } else if (numberMatches?.length) {
    // Usuario con LID
    who = numberMatches[0].replace(/[@\s]/g, "") + "@lid"
  } else if (m.quoted) {
    who = m.quoted.sender
  } else {
    who = m.sender // Por defecto, el que envió el mensaje
  }

  // 🔹 Obtener datos existentes
  whoData = getUser(who) || {}

  // 🔹 Nombre actual
  whoPushName = await conn.getName(who) || whoData.pushName || "Sin nombre"

  // 🔹 Guardar / actualizar usuario
  saveUser(who, {
    jid: who.endsWith("@s.whatsapp.net") ? who : (whoData.jid || ""),
    lid: who.endsWith("@lid") ? who : (whoData.lid || ""),
    pushName: whoPushName
  })

  // 🔹 Volver a cargar datos
  whoData = getUser(who)
  whoJid = whoData.jid || "No registrado"
  whoLid = whoData.lid || "No registrado"

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
