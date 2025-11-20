// 📂 plugins/antidelete.js — FelixCat_Bot 🐾
// Anti-Delete Toggle (un solo comando)

let handler = async (m, { conn, isAdmin, isOwner }) => {
  if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos.')
  if (!isAdmin && !isOwner) return m.reply('❌ Solo admins o dueños pueden usar este comando.')

  let chat = global.db.data.chats[m.chat]
  if (!chat) global.db.data.chats[m.chat] = {}
  chat = global.db.data.chats[m.chat]

  // Alternar estado (toggle)
  chat.antidelete = !chat.antidelete

  if (chat.antidelete === true) {
    return m.reply('🛡️ *Anti-Delete ACTIVADO*\nAhora verán los mensajes eliminados.')
  } else {
    return m.reply('🚫 *Anti-Delete DESACTIVADO*\nYa no se mostrarán mensajes eliminados.')
  }
}

handler.command = /^antidelete$/i
handler.admin = true
handler.botAdmin = true

export default handler

// =======================
//      BEFORE GLOBAL
// =======================

export async function before(m, { conn }) {
  try {
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
    let chat = global.db.data.chats[m.chat]

    // Guardado básico de mensajes
    if (!global.deletedMsgs) global.deletedMsgs = {}

    // Guardar texto normal
    if (m.text) {
      global.deletedMsgs[m.id] = {
        text: m.text,
        sender: m.sender
      }
    }

    // Detectar mensaje borrado
    if (
      chat.antidelete &&
      m.message?.protocolMessage?.type === 0
    ) {
      let key = m.message.protocolMessage.key
      let msg = global.deletedMsgs[key.id]

      if (!msg) return

      let user = msg.sender
      let number = user.split("@")[0]

      return await conn.sendMessage(m.chat, {
        text: `🗑️ *Mensaje eliminado*\n👤 @${number}\n💬 ${msg.text}`,
        mentions: [user]
      })
    }

  } catch (err) {
    console.log('❌ Error en antidelete:', err)
  }
}
