// 📂 plugins/grupos-mute.js — Gaara-Ultra-MD (versión robusta de mute + autodelete)

let mutedUsers = new Set()

/**
 * Normaliza JID a formato '12345678@s.whatsapp.net'
 */
function normalizeJid(jid = '') {
  if (!jid) return ''
  return jid.replace(/:\d+$/,'').replace(/@.+$/,'') + '@s.whatsapp.net'
}

/**
 * Reintenta borrar mensaje hasta n veces con delay
 */
async function tryDelete(conn, chatId, key, tries = 3, delay = 500) {
  for (let i = 0; i < tries; i++) {
    try {
      await conn.sendMessage(chatId, { delete: key })
      return true
    } catch (e) {
      // si es el último intento, relanzamos el error
      if (i === tries - 1) throw e
      await new Promise(r => setTimeout(r, delay))
    }
  }
  return false
}

let handler = async (m, { conn, isAdmin, isOwner, command }) => {

  try {
    // Siempre normalizamos el JID del remitente
    const senderJid = normalizeJid(m.sender)

    // ===============================
    //   AUTO-BORRADO PARA MUTEADOS
    // ===============================
    if (mutedUsers.has(senderJid)) {
      // Solo en grupos intentamos borrar
      if (!m.isGroup) return

      // Verificamos metadata actual para ver si el bot es admin
      const meta = await conn.groupMetadata(m.chat).catch(() => null) || {}
      const parts = meta.participants || []
      const botJid = normalizeJid(conn.user && (conn.user.id || conn.user) ? (conn.user.id.split?.(':')?.[0] || conn.user.id || conn.user) + '@s.whatsapp.net' : conn.user?.jid || conn.user)
      
      // Detectar admin con múltiples propiedades (isAdmin/isSuperAdmin/admin/role)
      const adminList = parts
        .filter(p => p.isAdmin || p.isSuperAdmin || p.admin === 'admin' || p.role === 'admin' || p.role === 'superadmin')
        .map(p => (p.id || p.jid || '').toString().replace(/:.*$/, ''))

      const isBotAdmin = adminList.includes(botJid.replace(/:.*$/, ''))

      if (!isBotAdmin) {
        // Si no es admin, opcional: avisar al chat (solo la primera vez por mensaje para evitar spam)
        // return; // no hacemos nada más si no es admin
        console.log(`[mute] No borro porque el bot NO es admin en ${m.chat}`)
        return
      }

      // No intentar borrar nuestros propios mensajes
      if (m.key && (m.key.fromMe || (normalizeJid(m.key.participant || '') === botJid))) return

      // Asegurarse de que exista ID
      const msgId = m.key && (m.key.id || (m.key?.messageId)) 
      if (!msgId) {
        console.log('[mute] Mensaje sin id, no se puede borrar:', m.key)
        return
      }

      // Construir key de borrado compatible
      const deleteKey = {
        remoteJid: m.chat,
        fromMe: false,
        id: msgId,
        participant: m.participant || m.key.participant || m.sender
      }

      try {
        await tryDelete(conn, m.chat, deleteKey, 3, 400)
        console.log(`[mute] Mensaje borrado de ${senderJid} en ${m.chat}`)
      } catch (err) {
        console.error('[mute] Error borrando mensaje (intentos agotados):', err)
      }

      return
    }

    // ===============================
    //   VALIDACIONES BÁSICAS
    // ===============================
    if (!m.isGroup) return
    if (!isAdmin && !isOwner) return
    if (!["mute", "unmute"].includes(command)) return

    // ===============================
    //   OBTENER @USUARIO
    // ===============================
    let who = m.mentionedJid?.[0] || (m.quoted?.sender ? m.quoted.sender : null)
    if (!who) return m.reply("⚠️ Debes mencionar o citar a un usuario.")

    who = normalizeJid(who)

    // ===============================
    //   PROTEGER OWNERS
    // ===============================
    const owners = [
      "59896026646@s.whatsapp.net",
      "59898719147@s.whatsapp.net"
    ]

    if (owners.includes(who)) return m.reply("❌ No puedes mutear/desmutear a un *owner*.")

    let tag = "@" + who.split("@")[0]

    // ===============================
    //   MUTE
    // ===============================
    if (command === "mute") {
      mutedUsers.add(who)
      return conn.sendMessage(m.chat, {
        text: `🔇 *Usuario muteado:* ${tag}`,
        mentions: [who]
      })
    }

    // ===============================
    //   UNMUTE
    // ===============================
    if (command === "unmute") {
      if (!mutedUsers.has(who)) return m.reply("⚠️ Ese usuario no estaba muteado.")

      mutedUsers.delete(who)
      return conn.sendMessage(m.chat, {
        text: `🔊 *Usuario desmuteado:* ${tag}`,
        mentions: [who]
      })
    }

  } catch (e) {
    console.error('Error en plugin mute:', e)
  }
}

handler.help = ["mute @usuario", "unmute @usuario"]
handler.tags = ["group"]
handler.command = ["mute", "unmute"]
handler.group = true
handler.admin = true

export default handler
