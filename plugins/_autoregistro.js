import fs from "fs"
import path from "path"
import { getUser, saveUser } from "../databaseFunctions.js"

// 🧱 Infraestructura
const DB_DIR = "./database"
const USERS_FILE = path.join(DB_DIR, "users.json")

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "{}")

let handler = async (m, { conn }) => {
  try {
    const sender = m.sender
    if (!sender) return

    // Solo registrar si no existe
    if (!getUser(sender)) {
      const pushName = await conn.getName(sender)
      saveUser(sender, {
        jid: sender.endsWith("@s.whatsapp.net") ? sender : "",
        lid: "", // Se completará luego con .lid
        pushName
      })
      console.log(`📝 Usuario registrado automáticamente: ${pushName} (${sender})`)
    }

  } catch (e) {
    console.error("AutoRegister error:", e)
  }
}

handler.all = true
export default handler
