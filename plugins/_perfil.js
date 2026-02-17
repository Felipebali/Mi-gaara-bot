// 📂 plugins/perfil.js
// 👤 Perfil del usuario (con foto si tiene)

let handler = async (m, { conn }) => {
  try {
    await m.react?.('👤')

    const user = m.sender
    const number = user.split('@')[0]

    // 📛 Nombre
    let name = await conn.getName(user)

    // 👑 Detectar admin
    let isAdmin = false
    if (m.isGroup) {
      const groupMeta = await conn.groupMetadata(m.chat)
      const participant = groupMeta.participants.find(p => p.id === user)
      if (participant?.admin) isAdmin = true
    }

    // 🖼️ Foto de perfil
    let ppUrl = null
    try {
      ppUrl = await conn.profilePictureUrl(user, 'image')
    } catch {
      ppUrl = null
    }

    // 🧾 Texto perfil
    const caption = `
👤 *PERFIL DE USUARIO*

📛 *Nombre:* ${name}
📱 *Número:* +${number}
👑 *Admin:* ${isAdmin ? '✅ Sí' : '❌ No'}
🤖 *Bot:* FelixCat-Bot

⚡ *Estado:* Activo
`.trim()

    // ✅ Si tiene foto → enviar imagen estilo creator
    if (ppUrl) {
      await conn.sendMessage(
        m.chat,
        {
          image: { url: ppUrl },
          caption: caption,
          footer: '*FelixCat-Bot 🐱*',
          headerType: 4,
          mentions: [user]
        },
        { quoted: m }
      )
    } 
    
    // ❌ Si no tiene foto → solo texto
    else {
      await conn.sendMessage(
        m.chat,
        {
          text: caption,
          mentions: [user]
        },
        { quoted: m }
      )
    }

  } catch (e) {
    console.error(e)
    m.reply('⚠️ Error al mostrar el perfil.')
  }
}

handler.help = ['perfil']
handler.tags = ['info']
handler.command = ['perfil', 'profile']

export default handler
