// 📂 plugins/antidelete.js — FelixCat_Bot 🐾
// Anti delete con toggle automático (funciona en Baileys 2024/2025)

let handler = async (m, { conn, isAdmin, isOwner }) => {
  if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos.')
  if (!isAdmin && !isOwner) return m.reply('❌ Solo administradores o dueños pueden usar este comando.')

  let chat = global.db.data.chats[m.chat]
  if (!chat) global.db.data.chats[m.chat] = {}

  chat = global.db.data.chats[m.chat]
  chat.antidelete = !chat.antidelete

  return m.reply(chat.antidelete
    ? '🛡️ *Anti-Delete ACTIVADO*'
    : '🚫 *Anti-Delete DESACTIVADO*'
  )
}

handler.command = /^antidelete$/i
handler.admin = true
handler.botAdmin = true

export default handler

// =============================================================
//            BEFORE — REVELA MENSAJES ELIMINADOS
// =============================================================

export async function before(m, { conn }) {
  try {
    if (!m.isGroup) return

    let chat = global.db.data.chats[m.chat]
    if (!chat) return
    if (!chat.antidelete) return

    // Base de datos para guardar los mensajes enviados en el grupo
    if (!global.savedMsgs) global.savedMsgs = {}

    // ---------------------------------------------
    // GUARDAR MENSAJES (texto y multimedia)
    // ---------------------------------------------
    if (m.message && !m.message.protocolMessage) {
      global.savedMsgs[m.key.id] = {
        id: m.key.id,
        sender: m.sender,
        chat: m.chat,
        message: m.message,
        text: m.text || null
      }
    }

    // ---------------------------------------------
    // DETECTAR MENSAJE ELIMINADO
    // ---------------------------------------------
    if (m.message?.protocolMessage?.type === 0) {
      const deletedKey = m.message.protocolMessage.key
      if (!deletedKey) return

      const saved = global.savedMsgs[deletedKey.id]
      if (!saved) return

      const sender = saved.sender
      const number = sender.split('@')[0]

      // Si tiene texto → enviar texto eliminado
      if (saved.text) {
        await conn.sendMessage(saved.chat, {
          text: `🗑️ *Mensaje Eliminado*\n👤 @${number}\n💬 ${saved.text}`,
          mentions: [sender]
        })
      }

      // Si era multimedia → reenviar lo que borraron
      if (saved.message?.imageMessage ||
          saved.message?.videoMessage ||
          saved.message?.stickerMessage ||
          saved.message?.audioMessage ||
          saved.message?.documentMessage) {

        await conn.sendMessage(saved.chat, {
          text: `🗑️ *Mensaje multimedia eliminado*\n👤 @${number}`,
          mentions: [sender]
        })

        await conn.sendMessage(
          saved.chat,
          saved.message,
          { quoted: null }
        )
      }
    }

  } catch (e) {
    console.log("Error en antidelete:", e)
  }
}
