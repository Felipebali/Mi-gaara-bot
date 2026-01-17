// Owner Manager – compatible con global.owner (MD)
// addowner / aowner
// removeowner / rowner

let handler = async (m, { conn, text = "", command }) => {
  try {
    let jid = null
    let who = null

    // ===== OBTENER JID REAL =====

    // 1️⃣ mención directa @usuario
    if (m.mentionedJid && m.mentionedJid.length > 0) {
      jid = m.mentionedJid[0]
    }

    // 2️⃣ responder a un mensaje
    else if (m.quoted?.sender) {
      jid = m.quoted.sender
    }

    // 3️⃣ número con +
    else {
      const matchPlus = text.match(/\+[0-9\s]+/)
      if (matchPlus) {
        who = matchPlus[0].replace(/\D/g, "")
        jid = who + "@s.whatsapp.net"
      }
    }

    if (!jid) {
      return conn.sendMessage(
        m.chat,
        { text: "❌ Usa @usuario, responde un mensaje o +598..." },
        { quoted: m }
      )
    }

    // ===== NORMALIZAR NÚMERO =====
    who = jid.split("@")[0]

    // ===== ASEGURAR ESTRUCTURA =====
    if (!Array.isArray(global.owner)) global.owner = []

    const exists = global.owner.find(o => o[0] === who)

    // ===== ADD OWNER =====
    if (/^(addowner|aowner)$/i.test(command)) {
      if (exists) {
        return conn.sendMessage(
          m.chat,
          {
            text: `⚠️ @${who} ya es owner.`,
            mentions: [jid]
          },
          { quoted: m }
        )
      }

      global.owner.push([who, "Owner", true])

      return conn.sendMessage(
        m.chat,
        {
          text: `✅ @${who} agregado como owner.`,
          mentions: [jid]
        },
        { quoted: m }
      )
    }

    // ===== REMOVE OWNER =====
    if (/^(removeowner|rowner)$/i.test(command)) {
      if (!exists) {
        return conn.sendMessage(
          m.chat,
          {
            text: `❌ @${who} no es owner.`,
            mentions: [jid]
          },
          { quoted: m }
        )
      }

      if (global.owner.length === 1) {
        return conn.sendMessage(
          m.chat,
          { text: "❌ No se puede eliminar el último owner." },
          { quoted: m }
        )
      }

      global.owner = global.owner.filter(o => o[0] !== who)

      return conn.sendMessage(
        m.chat,
        {
          text: `✅ @${who} removido de owners.`,
          mentions: [jid]
        },
        { quoted: m }
      )
    }

  } catch (e) {
    console.error("OWNER MANAGER ERROR:", e)
  }
}

handler.command = /^(addowner|removeowner|aowner|rowner)$/i
handler.owner = true

export default handler
