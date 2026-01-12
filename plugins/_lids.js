import { getUser, saveUser } from "../databaseFunctions.js"

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let who, whoData, whoLid, whoJid, whoPushName

  // 🔍 Buscar números en el texto
  const numberMatchesPlus = text.match(/\+[0-9\s]+/g)
  const numberMatches = text.match(/@[0-9\s]+/g)

  if (numberMatchesPlus && numberMatchesPlus.length > 0) {
    who = numberMatchesPlus[0].replace(/[+\s]/g, "") + "@s.whatsapp.net"
  } else if (numberMatches && numberMatches.length > 0) {
    who = numberMatches[0].replace("@", "").replace(/\s+/g, "") + "@lid"
  } else if (m.quoted) {
    who = m.quoted.sender
  } else {
    who = m.sender // Por defecto, el que envió el mensaje
  }

  // 🔹 Nombre actual
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
  const txt = `Usuario: +${whoJid.split("@")[0]}\n\nNombre actual: ${whoPushName}\n\nLid: ${whoLid}\n\nChat actual: ${m.chat}`

  conn.sendMessage(m.chat, { text: txt }, { quoted: m })
}

// 🔹 Comando y permisos
handler.command = ["lid"]
handler.owner = true

export default handler
