// 📂 plugins/owner-manager.js
// Compatible con Baileys MD – SIN reiniciar

let handler = async (m, { conn, text = "", command }) => {
  try {
    let jid

    // ===== OBTENER JID =====
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

    const who = jid.split("@")[0]

    // ===== ASEGURAR STRUCT =====
    if (!Array.isArray(global.owner)) global.owner = []

    // 🔥 CLAVE: sincronizar con opts / settings si existen
    if (!global.opts) global.opts = {}
    if (!Array.isArray(global.opts.owner)) {
      global.opts.owner = global.owner
    }

    const exists = global.owner.find(o => o[0] === who)

    // ===== ADD OWNER =====
    if (/^(addowner|aowner)$/i.test(command)) {
      if (exists) {
        return conn.sendMessage(
          m.chat,
          { text: `⚠️ @${who} ya es owner.`, mentions: [jid] },
          { quoted: m }
        )
      }

      const newOwner = [who, "Owner", true]

      global.owner.push(newOwner)
      global.opts.owner.push(newOwner) // 🔥 hot update

      return conn.sendMessage(
        m.chat,
        {
          text: `✅ @${who} ahora es owner.\n⚡ *Permisos aplicados al instante*`,
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
          { text: `❌ @${who} no es owner.`, mentions: [jid] },
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
      global.opts.owner = global.opts.owner.filter(o => o[0] !== who)

      return conn.sendMessage(
        m.chat,
        {
          text: `✅ @${who} removido de owners.\n⚡ *Permisos removidos al instante*`,
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
