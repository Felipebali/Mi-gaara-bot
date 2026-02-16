// 📂 plugins/perfil.js
// .perfil | .setbr | .bio
// Versión estable sin errores

let handler = async (m, { conn, text, mentionedJid, command }) => {
  try {

    // =====================
    // USUARIO OBJETIVO
    // =====================
    let who = mentionedJid && mentionedJid[0]
      ? mentionedJid[0]
      : m.sender

    const jid = conn.decodeJid ? conn.decodeJid(who) : who

    // =====================
    // BASE DE DATOS
    // =====================
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

      let pp = 'https://i.imgur.com/2yaf2wb.png'
      try {
        pp = await conn.profilePictureUrl(jid, 'image')
      } catch {}

      const nombre = await conn.getName(jid)
      const numero = jid.split('@')[0]

      const nacimiento = user.birth || 'No registrado'
      const bio = user.bio || 'Sin biografía'

      // =====================
      // DUEÑO DEL BOT
      // =====================
      const owners = (global.owner || []).map(v => {
        if (Array.isArray(v)) v = v[0]
        return String(v).replace(/[^0-9]/g, '') + '@s.whatsapp.net'
      })

      const isOwner = owners.includes(jid)

      // =====================
      // ADMIN DEL GRUPO
      // =====================
      let rolGrupo = 'Usuario 👤'

      if (m.isGroup) {
        try {
          const metadata = await conn.groupMetadata(m.chat)
          const participante = metadata.participants.find(p => p.id === jid)
          if (participante?.admin) rolGrupo = 'Admin 🛡️'
        } catch {}
      }

      if (isOwner) rolGrupo = 'Dueño del Bot 👑'

      const textoPerfil = `
╭━━━〔 👤 PERFIL 〕━━━⬣
┃ 🏷️ Nombre: ${nombre}
┃ 📱 Número: +${numero}
┃ 🛡️ Rol: ${rolGrupo}
┃ 🎂 Nacimiento: ${nacimiento}
┃ 📝 Bio: ${bio}
┃ 📅 Hoy: ${new Date().toLocaleDateString()}
╰━━━━━━━━━━━━⬣
`

      await conn.sendMessage(
        m.chat,
        {
          image: { url: pp },
          caption: textoPerfil,
          mentions: [jid]
        },
        { quoted: m }
      )
    }

  } catch (e) {
    console.error('Error en perfil:', e)
    m.reply('❌ Error en el comando perfil.')
  }
}

handler.command = ['perfil', 'setbr', 'bio']
handler.tags = ['info']
handler.help = ['perfil', 'setbr', 'bio']

export default handler
