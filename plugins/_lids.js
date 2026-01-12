import { getUser, saveUser } from "../databaseFunctions.js"

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let who, whoData, whoLid, whoJid, whoPushName

  const numberMatchesPlus = text.match(/\+[0-9\s]+/g)
  const numberMatches = text.match(/@[0-9\s]+/g)

  if (numberMatchesPlus?.length) {
    who = numberMatchesPlus[0].replace(/[+\s]/g, "") + "@s.whatsapp.net"
  } else if (numberMatches?.length) {
    who = numberMatches[0].replace(/[@\s]/g, "") + "@lid"
  } else if (m.quoted) {
    who = m.quoted.sender
  } else {
    who = m.sender // Por defecto, quien envía
  }

  // 🔹 Nombre actual del usuario
  whoPushName = await conn.getName(who) || "Sin nombre"

  // 🔹 Guardar o actualizar usuario en users.json
  const existing = getUser(who) || {}
  saveUser(who, {
    jid: who.endsWith("@s.whatsapp.net") ? who : (existing.jid || ""),
    lid: who.endsWith("@lid") ? who : (existing.lid || ""),
    pushName: whoPushName
  })

  // 🔹 Volver a cargar datos
  whoData = getUser(who)
  whoJid = whoData.jid || "No registrado"
  whoLid = whoData.lid || "No registrado"

  // 🔹 Texto de salida
  const txt = `
🧾 *Información del usuario*

👤 Usuario: +${whoJid.split("@")[0]}
📛 Nombre actual: ${whoPushName}

🆔 LID: ${whoLid}

💬 Chat actual: ${m.chat}
`.trim()

  await conn.sendMessage(m.chat, { text: txt }, { quoted: m })
}

handler.command = ["lid"]
handler.owner = true

export default handler
