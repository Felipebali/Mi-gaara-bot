// 📂 plugins/antidelete.js — FelixCat_Bot 🐾
// AntiDelete UNIVERSAL (funciona en TODAS las versiones de Baileys)

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
export default handler



// ===================================================================
//                       BEFORE — ANTI DELETE
// ===================================================================
export async function before(m, { conn }) {
  try {
    if (!m.isGroup) return

    let chat = global.db.data.chats[m.chat]
    if (!chat || !chat.antidelete) return

    if (!global.savedMsgs) global.savedMsgs = {}

    //----------------------------------------------------------------
    // GUARDAR MENSAJES NORMALES
    //----------------------------------------------------------------
    if (m.message && !m.message.protocolMessage) {

      global.savedMsgs[m.key.id] = {
        key: m.key,
        sender: m.sender,
        chat: m.chat,
        message: m.message,
        text: m.text || null
      }
    }

    //----------------------------------------------------------------
    // DETECTAR DELETE — COMPATIBLE CON TODAS LAS VERSIONES
    //----------------------------------------------------------------
    const proto = m.message?.protocolMessage

    if (
      proto &&
      (
        proto.type === 0 ||  // algunas versiones antiguas
        proto.type === 1 ||  // versiones nuevas
        proto.type === 2 ||  // algunos forks
        proto.key            // fallback universal
      )
    ) {

      const deleted = proto.key
      if (!deleted) return

      const saved = global.savedMsgs[deleted.id]
      if (!saved) return // no está guardado → no se puede recuperar

      const user = saved.sender
      const number = user.split("@")[0]

      //----------------------------------------------------------------
      // SI ERA TEXTO
      //----------------------------------------------------------------
      if (saved.text) {
        await conn.sendMessage(saved.chat, {
          text: `🗑️ *Mensaje eliminado*\n👤 @${number}\n💬 ${saved.text}`,
          mentions: [user]
        })
      }

      //----------------------------------------------------------------
      // SI ERA MULTIMEDIA
      //----------------------------------------------------------------
      const msg = saved.message

      if (
        msg?.imageMessage ||
        msg?.videoMessage ||
        msg?.audioMessage ||
        msg?.stickerMessage ||
        msg?.documentMessage
      ) {
        await conn.sendMessage(saved.chat, {
          text: `🗑️ *Mensaje multimedia eliminado*\n👤 @${number}`,
          mentions: [user]
        })

        await conn.sendMessage(saved.chat, msg)
      }
    }

  } catch (e) {
    console.log("❌ Error en AntiDelete:", e)
  }
}
