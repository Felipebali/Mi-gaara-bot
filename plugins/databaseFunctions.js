import fs from "fs"
import path from "path"

const DB_DIR = "./database"
const USERS_FILE = path.join(DB_DIR, "users.json")

// 🧱 Crear estructura si no existe
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "{}")

function loadUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"))
}

function saveUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2))
}

// 🧠 Obtener usuario
export function getUser(id) {
  const users = loadUsers()
  return users[id] || null
}

// 💾 Crear / actualizar usuario
export function saveUser(id, data) {
  const users = loadUsers()
  users[id] = {
    ...(users[id] || {}),
    ...data,
    updatedAt: Date.now()
  }
  saveUsers(users)
}
