import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CONFIG_PATH = path.join(__dirname, "../config.js")

let handler = async (m, { client, text, usedPrefix, command }) => {
  let who = ""

  // ===== obtener número =====
  const matchPlus = text?.match(/\+[0-9\s]+/)
  const matchAt = text?.match(/@[0-9\s]+/)

  if (matchPlus) {
    who = matchPlus[0].replace(/[+\s]/g, "")
  } else if (matchAt) {
    who = matchAt[0].replace(/[@\s]/g, "")
  } else if (m.quoted) {
    who = m.quoted.sender.replace(/@s\.whatsapp\.net$/, "")
  }

  if (!who) {
    return client.sendText(
      m.chat,
      `❌ Número inválido.\n\nEjemplo:\n${usedPrefix}${command} +598 99 999 999`,
      m
    )
  }

  // ===== cargar config.js =====
  let configText
  try {
    configText = fs.readFileSync(CONFIG_PATH, "utf8")
  } catch {
    return client.sendText(m.chat, "❌ Error al leer config.js", m)
  }

  // ===== extraer owners =====
  const ownersMatch = configText.match(/owners\s*=\s*\[([\s\S]*?)\]/)
  if (!ownersMatch) {
    return client.sendText(m.chat, "❌ No se encontró `owners` en config.js", m)
  }

  let currentOwners = ownersMatch[1]
    .split(",")
    .map(v => v.replace(/["'\s]/g, ""))
    .filter(Boolean)

  // ===== ADD OWNER =====
  if (command === "addowner" || command === "aowner") {
    if (currentOwners.includes(who)) {
      return client.sendText(m.chat, `⚠️ *${who}* ya es owner.`, m)
    }

    currentOwners.push(who)
  }

  // ===== REMOVE OWNER =====
  if (command === "removeowner" || command === "rowner") {
    if (!currentOwners.includes(who)) {
      return client.sendText(m.chat, `❌ *${who}* no es owner.`, m)
    }

    if (currentOwners.length === 1) {
      return client.sendText(m.chat, "❌ No se puede eliminar el último owner.", m)
    }

    currentOwners = currentOwners.filter(o => o !== who)
  }

  // ===== reescribir config.js =====
  const newConfig = configText.replace(
    /owners\s*=\s*\[[\s\S]*?\]/,
    `owners = [\n  "${currentOwners.join('",\n  "')}"\n]`
  )

  fs.writeFileSync(CONFIG_PATH, newConfig)

  // actualizar memoria
  globalThis.owners = currentOwners

  return client.sendText(
    m.chat,
    `✅ Owners actualizados correctamente.`,
    m
  )
}

handler.command = /^(addowner|removeowner|aowner|rowner)$/i
handler.owner = true

export default handler
