// 📂 plugins/antidelete.js — FelixCat_Bot 🐾
// Anti Delete 100% funcional en Baileys 2024/2025

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
//         BEFORE — Guarda y detecta mensajes eliminados
// =============================================================
export async function before(m, { conn }) {
  try {
    if (!m.isGroup) return
    let chat = global.db.data.chats[m.chat]
    if (!chat || !chat.antidelete) return

    if (!global.savedMsgs) global.savedMsgs = {}

    // ------------------------------
    // GUARDAR MENSAJES
    // ------------------------------
    if (m.message && !m.message.protocolMessage) {
      global.savedMsgs[m.key.id] = {
        id: m.key.id,
        sender: m.sender,
        chat: m.chat,
        message: m.message,
        text: m.text || null
      }
    }

    // ------------------------------
    // DETECTAR DELETE (Baileys 2024/2025 usa type 1)
    // ------------------------------
    if (m.message?.protocolMessage?.type === 1) {

      const deletedKey = m.message.protocolMessage.key  
      if (!deletedKey) return

      const saved = global.savedMsgs[deletedKey.id]
      if (!saved) return

      const sender = saved.sender
      const number = sender.split("@")[0]

      // Si era texto
      if (saved.text) {
        await conn.sendMessage(saved.chat, {
          text: `🗑️ *Mensaje eliminado*\n👤 @${number}\n💬 ${saved.text}`,
          mentions: [sender]
        })
      }

      // Si era multimedia
      if (
        saved.message?.imageMessage ||
        saved.message?.videoMessage ||
        saved.message?.audioMessage ||
        saved.message?.stickerMessage ||
        saved.message?.documentMessage
      ) {

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
    console.error("❌ Error AntiDelete:", e)
  }
}
