// 📂 plugins/perfil.js
// .perfil | .setbr | .bio
// Rol detecta Owner + Admin correctamente

let handler = async (m, { conn, text, command }) => {
  try {

    // =====================
    // QUIÉN USA EL COMANDO
    // =====================
    const who = conn.decodeJid ? conn.decodeJid(m.sender) : m.sender
    const username = who.split('@')[0]

    // =====================
    // BASE DE DATOS
    // =====================
    global.db.data.users = global.db.data.users || {}
    global.db.data.users[who] = global.db.data.users[who] || {}

    let user = global.db.data.users[who]

    // =====================
    // SET FECHA NACIMIENTO
    // =====================
    if (command === 'setbr') {
      if (!text) return m.reply('✏️ Uso:\n.setbr 31/12/1998')
      user.birth = text.trim()
      return m.reply('✅ Fecha de nacimiento guardada.')
    }

    // =====================
    // SET BIO
    // =====================
    if (command === 'bio') {
      if (!text) return m.reply('✏️ Uso:\n.bio Hola soy nuevo 😎')
      user.bio = text.trim()
      return m.reply('✅ Biografía guardada.')
    }

    // =====================
    // PERFIL
    // =====================
    if (command === 'perfil') {

      const nacimiento = user.birth || 'No registrado'
      const bio = user.bio || 'Sin biografía'

      // =====================
      // OWNERS
      // =====================
      const owners = (global.owner || []).map(v => {
        if (Array.isArray(v)) v = v[0]
        return String(v).replace(/[^0-9]/g, '') + '@s.whatsapp.net'
      })

      const isOwner = owners.includes(who)

      // =====================
      // ADMIN GRUPO
      // =====================
      let isAdmin = false

      if (m.isGroup) {
        try {
          const metadata = await conn.groupMetadata(m.chat)
          const participante = metadata.participants.find(p => {
            const id = conn.decodeJid ? conn.decodeJid(p.id) : p.id
            return id === who
          })

          if (participante?.admin) isAdmin = true
        } catch {}
      }

      // =====================
      // ROL FINAL
      // =====================
      let rol = 'Usuario 👤'

      if (isOwner && isAdmin) {
        rol = 'Dueño del Bot 👑 | Admin 🛡️'
      } else if (isOwner) {
        rol = 'Dueño del Bot 👑'
      } else if (isAdmin) {
        rol = 'Admin del Grupo 🛡️'
      }

      // =====================
      // TEXTO PERFIL
      // =====================
      const textoPerfil = `
👤 *PERFIL DE USUARIO*

🆔 *Usuario:* @${username}
⭐ *Rol:* ${rol}

🎂 *Nacimiento:* ${nacimiento}
📝 *Bio:* ${bio}

📅 *Hoy:* ${new Date().toLocaleDateString()}
`.trim()

      // =====================
      // FOTO PERFIL
      // =====================
      let ppUrl = null
      try {
        ppUrl = await conn.profilePictureUrl(who, 'image')
      } catch {
        ppUrl = null
      }

      // =====================
      // ENVÍO
      // =====================
      if (ppUrl) {
        await conn.sendMessage(
          m.chat,
          {
            image: { url: ppUrl },
            caption: textoPerfil,
            footer: '*FelixCat-Bot 🐱*',
            headerType: 4,
            mentions: [who]
          },
          { quoted: m }
        )
      } else {
        await conn.sendMessage(
          m.chat,
          {
            text: textoPerfil,
            mentions: [who]
          },
          { quoted: m }
        )
      }
    }

  } catch (e) {
    console.error('Error perfil:', e)
    m.reply('❌ Error en el comando perfil.')
  }
}

handler.command = ['perfil', 'setbr', 'bio']
handler.tags = ['info']
handler.help = ['perfil', 'setbr', 'bio']

export default handler
