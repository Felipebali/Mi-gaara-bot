// Owner Manager – compatible con global.owner (MD)

let handler = async (m, { conn, text = "", command }) => {
  try {
    let jid

    // ===== OBTENER JID REAL =====
    if (m.mentionedJid?.length) {
      jid = m.mentionedJid[0]
    } else if (m.quoted?.sender) {
      jid = m.quoted.sender
    } else {
      const matchPlus = text.match(/\+[0-9\s]+/)
      if (matchPlus) {
        jid = matchPlus[0].replace(/\D/g, "") + "@s.whatsapp.net"
      }
    }

    if (!jid) {
      return conn.sendMessage(
        m.chat,
        { text: "❌ Usa @usuario, responde o +598..." },
        { quoted: m }
      )
    }

    // ===== NORMALIZAR =====
    const who = jid.split("@")[0]

    // ===== ASEGURAR ARRAY =====
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

      // ⬅️ FORMATO CORRECTO
      global.owner.push([who, "Owner", true])

      return conn.sendMessage(
        m.chat,
        {
          text: `✅ @${who} ahora es owner.\n♻️ *Reinicia el bot para aplicar permisos.*`,
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
          text: `✅ @${who} removido de owners.\n♻️ *Reinicia el bot para aplicar permisos.*`,
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
