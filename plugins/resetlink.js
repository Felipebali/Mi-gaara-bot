// 📂 plugins/resetlink.js — Comando solo para owners 👑

let handler = async (m, { conn }) => {
  const owners = ['59896026646', '59898719147']
  const sender = m.sender.split('@')[0]

  // --- VERIFICACIONES ---
  if (!owners.includes(sender)) return // Solo owners

  if (!m.isGroup) 
    return m.reply('❌ Este comando solo funciona en grupos.')

  // Verificar si el bot es admin
  const botNumber = conn.user.id.split(':')[0]
  const isBotAdmin = (await conn.groupMetadata(m.chat))
    .participants
    .some(p => p.id.split('@')[0] === botNumber && p.admin !== null)

  if (!isBotAdmin) 
    return m.reply('❌ Necesito ser *administrador* del grupo para resetear el link.')

  try {
    // Resetea el link del grupo
    let res = await conn.groupRevokeInvite(m.chat)
    
    // Envía el nuevo link
    await conn.sendMessage(m.chat, { 
      text: `🔗 *Link del grupo reseteado correctamente*\n\nNuevo link:\nhttps://chat.whatsapp.com/${res}`
    })
  } catch (e) {
    console.error(e)
    m.reply('⚠️ Ocurrió un error al intentar resetear el link.')
  }
}

// --- Configuración del comando ---
handler.help = ['resetlink']
handler.tags = ['group']

// Regex interno con prefijo, evita "comando no disponible"
handler.command = /^\.resetlink$/i

export default handler
