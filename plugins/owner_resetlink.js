// 📂 plugins/resetlink.js — Solo Owners 👑

let handler = async (m, { conn, isOwner, isBotAdmin }) => {
  // --- PERMISOS ---
  if (!m.isGroup) 
    return m.reply('❌ Este comando solo funciona en grupos.')

  if (!isOwner) 
    return m.reply('❌ Solo los *dueños* del bot pueden usar este comando.')

  if (!isBotAdmin) 
    return m.reply('❌ Necesito ser *administrador* para resetear el link.')

  try {
    let res = await conn.groupRevokeInvite(m.chat)
    await conn.sendMessage(m.chat, { 
      text: `🔗 *Link del grupo reseteado correctamente*\n\nNuevo link:\nhttps://chat.whatsapp.com/${res}`
    })
  } catch (e) {
    console.error(e)
    m.reply('⚠️ Ocurrió un error al intentar resetear el link.')
  }
}

handler.help = ['resetlink']
handler.tags = ['group']
handler.command = /^resetlink$/i
handler.owner = true

export default handler
