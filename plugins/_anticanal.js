function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

// Detecta canales reales
const canalRegex = /https?:\/\/(?:www\.)?whatsapp\.com\/channel\/[0-9A-Za-z]+/i

export default {
  command: ["anticanal"],
  admin: true,

  run: async ({ conn, m, remoteJid, senderJid, isGroup, isAdmin }) => {
    // Solo grupos
    if (!isGroup) {
      return conn.sendText(remoteJid, "❌ Este comando solo funciona en grupos.", m)
    }

    // Solo admins
    if (!isAdmin) {
      return conn.sendText(
        remoteJid,
        "🛡️ Solo administradores pueden activar/desactivar Anti-Canal.",
        m,
        { mentions: [senderJid] }
      )
    }

    // Inicializar BD si no existe
    if (!global.db.data.chats) global.db.data.chats = {}
    if (!global.db.data.chats[remoteJid]) {
      global.db.data.chats[remoteJid] = {
        antilink: true,
        anticanal: true
      }
    }

    // Activar/desactivar
    const estadoActual = global.db.data.chats[remoteJid].anticanal
    const nuevoEstado = !estadoActual

    global.db.data.chats[remoteJid].anticanal = nuevoEstado

    // Confirmación
    const emoji = nuevoEstado ? "✅" : "❌"

    await conn.sendMessage(remoteJid, {
      react: { text: emoji, key: m.key }
    })

    return conn.sendText(
      remoteJid,
      `📢 Anti-Canal *${nuevoEstado ? "ACTIVADO" : "DESACTIVADO"}*`,
      m
    )
  }
}

// ------------------------
// BLOQUEADOR AUTOMÁTICO
// ------------------------

export async function before(m, { conn, isBotAdmin, isAdmin }) {
  if (!m.isGroup) return true

  const chat = global.db.data.chats[m.chat]
  if (!chat?.anticanal) return true

  const text =
    m.text ||
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    m.message?.caption ||
    ""

  if (!text) return true

  // No es canal → ignorar
  if (!canalRegex.test(text)) return true

  const who = m.sender
  const number = cleanNum(who)

  const owners = ['59896026646', '59898719147', '59892363485']
  if (owners.includes(number)) return true

  // No admin → aviso
  if (!isBotAdmin) {
    await conn.sendText(m.chat, "⚠️ Hay un canal, pero no soy admin para borrarlo.", m)
    return false
  }

  // Eliminar mensaje
  try {
    await conn.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: m.key.fromMe,
        id: m.key.id,
        participant: m.key.participant || m.sender
      }
    })
  } catch {}

  // Avisar
  await conn.sendMessage(m.chat, {
    text: `🚫 Enlace de *CANAL* eliminado.\n@${who.split("@")[0]}`,
    mentions: [who]
  })

  // Expulsar si NO es admin
  if (!isAdmin) {
    try {
      await conn.groupParticipantsUpdate(m.chat, [m.sender], "remove")
    } catch {}
  }

  return false
}
