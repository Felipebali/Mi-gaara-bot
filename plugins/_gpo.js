// 📂 plugins/gpo.js
// 📸 Obtener foto del grupo — SOLO OWNERS reales del bot

let handler = async (m, { conn }) => {
  try {
    // 🔐 Validación centralizada de owner
    if (!m.isOwner)
      return m.reply('🚫 Solo los dueños del bot pueden usar este comando.')

    if (!m.isGroup)
      return m.reply('❌ Este comando solo funciona en grupos.')

    const groupId = m.chat

    // 🖼️ Obtener foto del grupo
    let ppUrl
    try {
      ppUrl = await conn.profilePictureUrl(groupId, 'image')
    } catch {
      ppUrl = null
    }

    if (!ppUrl)
      return m.reply('❌ Este grupo no tiene foto de perfil.')

    await conn.sendMessage(m.chat, {
      image: { url: ppUrl },
      caption: '📸 Foto del grupo'
    }, { quoted: m })

  } catch (err) {
    console.error(err)
    m.reply('⚠️ Ocurrió un error al intentar descargar la foto del grupo.')
  }
}

handler.command = ['gpo']
handler.tags = ['owner', 'tools']
handler.help = ['gpo']
handler.group = true
handler.owner = true   // 🔐 usa config.js

export default handler
