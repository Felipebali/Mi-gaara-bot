import { saveDB } from '../db.js'

function cleanNum(jid) {
  return String(jid || "").replace(/[^0-9]/g, "").trim()
}

// 🔥 REGEX PARA DETECTAR LINKS DE CANAL
const canalRegex = /(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/[0-9A-Za-z_-]+/i

export default {
  command: ["anticanal"],
  admin: true,

  run: async ({ conn, m, remoteJid, senderJid, isGroup, isAdmin }) => {
    try {
      if (!isGroup) {
        return await conn.sendText(remoteJid, "❌ Este comando solo funciona en grupos.", m)
      }

      if (!isAdmin) {
        return await conn.sendText(
          remoteJid,
          "🛡️ Solo los administradores pueden usar este comando.",
          m,
          { mentions: [senderJid] }
        )
      }

      if (!global.db.data.chats) global.db.data.chats = {}
      if (!global.db.data.chats[remoteJid]) {
        global.db.data.chats[remoteJid] = {
          antilink: true,
          anticanal: true
        }
      }

      const estadoActual = global.db.data.chats[remoteJid].anticanal
      const nuevoEstado = !estadoActual

      global.db.data.chats[remoteJid].anticanal = nuevoEstado
      saveDB()

      const emoji = nuevoEstado ? '✅' : '❌'
      await conn.sendMessage(remoteJid, {
        react: { text: emoji, key: m.key }
      })

      console.log(`${nuevoEstado ? "✅ Anticanal ACTIVADO" : "❌ Anticanal DESACTIVADO"}: ${remoteJid}`)

    } catch (err) {
      console.error("❌ Error en anticanal.js:", err)
    }
  },

  // =========================================================
  // 📱 BEFORE → DETECTA TODO TIPO DE CANALES
  // =========================================================

  before: async ({ conn, m, remoteJid, senderJid, isGroup, isAdmin, isBotAdmin }) => {
    try {
      if (!isGroup) return true
      if (!global.db.data.chats[remoteJid]) return true

      const chat = global.db.data.chats[remoteJid]
      if (!chat.anticanal) return true
      if (!m.message) return true

      const num = cleanNum(senderJid)
      const mention = senderJid

      // Extraer texto
      const text =
        m.text ||
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.caption ||
        ''

      // =========================================================
      // 🔍 1) DETECTA LINKS DE CANALES
      // =========================================================
      if (text && canalRegex.test(text)) {

        if (!isBotAdmin) {
          return await conn.sendText(remoteJid, "⚠️ Hay un link de canal, pero no soy admin.")
        }

        await conn.sendMessage(remoteJid, {
          delete: {
            remoteJid,
            fromMe: false,
            id: m.key.id,
            participant: m.key.participant || senderJid
          }
        })

        await conn.sendText(
          remoteJid,
          `🚫 Link de canal eliminado.\n@${num}`,
          null,
          { mentions: [mention] }
        )

        if (!isAdmin) {
          await conn.groupParticipantsUpdate(remoteJid, [senderJid], "remove")
        }

        return false
      }

      // =========================================================
      // 🔍 2) DETECTA MENSAJES REENVIADOS DESDE CANALES
      // =========================================================
      const isForwarded = m.message?.extendedTextMessage?.contextInfo?.isForwarded
      const isFromNewsletter = m.message?.extendedTextMessage?.contextInfo?.forwardedNewsletterMessageInfo

      if (isForwarded && isFromNewsletter) {

        if (!isBotAdmin) {
          return await conn.sendText(remoteJid, "⚠️ Se detectó contenido de canal, pero no soy admin.")
        }

        await conn.sendText(
          remoteJid,
          `📱 @${num} compartió contenido de canal.\nSerá eliminado...`,
          null,
          { mentions: [mention] }
        )

        // borrar mensaje
        try {
          await conn.sendMessage(remoteJid, {
            delete: {
              remoteJid,
              fromMe: false,
              id: m.key.id,
              participant: m.key.participant || senderJid
            }
          })
        } catch (err) {
          console.error("⚠️ Error eliminando mensaje:", err)
        }

        // expulsar
        if (!isAdmin) {
          try {
            await conn.groupParticipantsUpdate(remoteJid, [senderJid], "remove")
          } catch (err) {
            console.error("⚠️ Error expulsando:", err)
          }
        }

        return false
      }

      return true

    } catch (err) {
      console.error("❌ Error en before de anticanal:", err)
    }
  }
}
