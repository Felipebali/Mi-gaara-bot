import { getUser, saveUser } from "../databaseFunctions.js"

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let who, whoData, whoJid, whoLid, whoPushName

  // 🔍 Buscar números en el texto
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

  // 🔹 Guardar / actualizar usuario automáticamente
  saveUser(who, {
    jid: who.endsWith("@s.whatsapp.net") ? who : (whoData.jid || ""),
    lid: who.endsWith("@lid") ? who : (whoData.lid || ""),
    pushName: whoPushName
  })

  // 🔹 Volver a cargar datos
  whoData = getUser(who)
  whoJid = whoData.jid || "No registrado"
  whoLid = whoData.lid || "No registrado"

  // 🔹 Texto de salida
  const txt = `
🧾 *Información del usuario*

👤 Usuario: +${whoJid.replace(/@.*/, "")}
📛 Nombre actual: ${whoPushName}

🆔 LID: ${whoLid}

💬 Chat actual: ${m.chat}
`.trim()

  await conn.sendMessage(m.chat, { text: txt }, { quoted: m })
}

// 🔹 Comando y permisos
handler.command = ["lid"]
handler.owner = true

export default handler
