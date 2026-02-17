// 📂 plugins/perfil.js
// .perfil | .setbr | .bio
// Sistema estable — Estilo visual tipo creador

let handler = async (m, { conn, text, command }) => {
  try {

    // =====================
    // JID NORMALIZADO
    // =====================
    const jid = conn.decodeJid ? conn.decodeJid(m.sender) : m.sender
    const numero = jid.replace(/[^0-9]/g, '')

    // =====================
    // BASE DE DATOS
    // =====================
    global.db.data.users = global.db.data.users || {}
    global.db.data.users[jid] = global.db.data.users[jid] || {}

    let user = global.db.data.users[jid]

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

      const nombre = await conn.getName(jid)

      const nacimiento = user.birth || 'No registrado'
      const bio = user.bio || 'Sin biografía'

      // =====================
      // OWNERS
      // =====================
      const owners = (global.owner || []).map(v => {
        if (Array.isArray(v)) v = v[0]
        return String(v).replace(/[^0-9]/g, '') + '@s.whatsapp.net'
      })

      const isOwner = owners.includes(jid)

      // =====================
      // ROL
      // =====================
      let rol = 'Usuario 👤'

      if (isOwner) {
        rol = 'Creador del Bot 👑'
      } else if (m.isGroup) {
        try {
          const metadata = await conn.groupMetadata(m.chat)
          const participante = metadata.participants.find(p => {
            const id = conn.decodeJid ? conn.decodeJid(p.id) : p.id
            return id === jid
          })

          if (participante?.admin) rol = 'Admin del Grupo 🛡️'
        } catch {}
      }

      // =====================
      // TEXTO PERFIL BONITO
      // =====================
      const textoPerfil = `
👤 *PERFIL DE USUARIO*

🏷️ *Nombre:* ${nombre}
📱 *Número:* +${numero}
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
        ppUrl = await conn.profilePictureUrl(jid, 'image')
      } catch {
        ppUrl = null
      }

      // =====================
      // ENVÍO ESTILO CREADOR
      // =====================
      if (ppUrl) {
        await conn.sendMessage(
          m.chat,
          {
            image: { url: ppUrl },
            caption: textoPerfil,
            footer: '*FelixCat-Bot 🐱*',
            headerType: 4,
            mentions: [jid]
          },
          { quoted: m }
        )
      } else {
        await conn.sendMessage(
          m.chat,
          {
            text: textoPerfil,
            mentions: [jid]
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
