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
    // 🔹 Asegurarse de que sea un mensaje válido
    if (!m?.sender) return

    // 🔹 Normalizar el sender
    const sender = m.sender.toString().replace(/[^0-9]/g, "") + "@s.whatsapp.net"

    // 🔹 Comprobar si ya existe en la DB
    if (!getUser(sender)) {
      const pushName = await conn.getName(sender) || "Sin nombre"

      // 🔹 Guardar usuario automáticamente
      saveUser(sender, {
        jid: sender,
        lid: "", // se completará luego con .lid
        pushName
      })

      console.log(`📝 Usuario registrado automáticamente: ${pushName} (${sender})`)
    }

  } catch (e) {
    console.error("AutoRegister error:", e)
  }
}

// 🔹 Ejecutar para todos los mensajes
handler.all = true

export default handler
