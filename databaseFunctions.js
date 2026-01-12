import fs from "fs"
import path from "path"

const DB_DIR = "./database"
const USERS_FILE = path.join(DB_DIR, "users.json")

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "{}")

// Cargar todos los usuarios
export function loadUsers() {
  const data = fs.readFileSync(USERS_FILE, "utf-8")
  return JSON.parse(data)
}

// Guardar todos los usuarios
export function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

// Obtener un usuario
export function getUser(jid) {
  const users = loadUsers()
  return users[jid] || null
}

// Guardar / actualizar un usuario
export function saveUser(jid, data) {
  const users = loadUsers()
  users[jid] = {
    ...users[jid], // mantener datos existentes
    ...data
  }
  saveUsers(users)
}
