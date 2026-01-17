// Owner Manager – compatible con global.owner (MD)

let handler = async (m, { conn, text = "", command }) => {
  try {
    let who = ""

    // ===== OBTENER NÚMERO =====
    const matchPlus = text.match(/\+[0-9\s]+/)
    const matchAt = text.match(/@[0-9]+/)

    if (matchPlus) {
      who = matchPlus[0].replace(/[+\s]/g, "")
    } else if (matchAt) {
      who = matchAt[0].replace(/[@\s]/g, "")
    } else if (m.quoted?.sender) {
      who = m.quoted.sender.split("@")[0]
    }

    if (!who) {
      return conn.sendMessage(
        m.chat,
        { text: "❌ Usa @usuario o +598..." },
        { quoted: m }
      )
    }

    // ===== ASEGURAR ESTRUCTURA =====
    if (!Array.isArray(global.owner)) global.owner = []

    const jid = who + "@s.whatsapp.net"
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
