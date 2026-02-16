// 📂 plugins/perfil.js
// .perfil | .setbr | .bio
// Usa sistema de foto como gpu.js
// Si no hay foto → manda solo texto

let handler = async (m, { conn, text, command }) => {
  try {

    const jid = conn.decodeJid ? conn.decodeJid(m.sender) : m.sender

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

      const nombre = await conn.getName(jid)
      const numero = jid.split('@')[0]

      const nacimiento = user.birth || 'No registrado'
      const bio = user.bio || 'Sin biografía'

      // 🔐 OWNERS reales
      const owners = (global.owner || []).map(v => {
        if (Array.isArray(v)) v = v[0]
        return String(v).replace(/[^0-9]/g, '') + '@s.whatsapp.net'
      })

      const isOwner = owners.includes(jid)

      // 🛡️ ADMIN GRUPO
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

      // =====================
      // FOTO (MISMA LÓGICA GPU)
      // =====================
      let ppUrl = null
      try {
        ppUrl = await conn.profilePictureUrl(jid, 'image')
      } catch {
        ppUrl = null
      }

      // ✅ Si tiene foto → manda imagen
      if (ppUrl) {
        await conn.sendMessage(m.chat, {
          image: { url: ppUrl },
          caption: textoPerfil,
          mentions: [jid]
        }, { quoted: m })
      }

      // ✅ Si NO tiene foto → solo texto
      else {
        await conn.sendMessage(m.chat, {
          text: textoPerfil,
          mentions: [jid]
        }, { quoted: m })
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
