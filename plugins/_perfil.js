// 📂 plugins/perfil.js — PERFIL FelixCat 🐾 SIN XP

let handler = async (m, { conn, text, command }) => {
  try {

    const jid = conn.decodeJid ? conn.decodeJid(m.sender) : m.sender
    const username = jid.split('@')[0]

    // =====================
    // DB SEGURA
    // =====================
    global.db.data ||= {}
    global.db.data.users ||= {}
    global.db.data.users[jid] ||= {
      registered: Date.now()
    }

    let user = global.db.data.users[jid]

    // =====================
    // FUNCIONES FECHA
    // =====================
    const calcularEdad = (fecha) => {
      try {
        const [d, m, a] = fecha.split('/').map(Number)
        if (!d || !m || !a) return null

        const nacimiento = new Date(a, m - 1, d)
        const hoy = new Date()

        let edad = hoy.getFullYear() - nacimiento.getFullYear()
        const diff = hoy.getMonth() - nacimiento.getMonth()

        if (diff < 0 || (diff === 0 && hoy.getDate() < nacimiento.getDate()))
          edad--

        return edad
      } catch {
        return null
      }
    }

    const diasParaCumple = (fecha) => {
      try {
        const [d, m] = fecha.split('/').map(Number)
        if (!d || !m) return null

        const hoy = new Date()
        let cumple = new Date(hoy.getFullYear(), m - 1, d)

        if (cumple < hoy)
          cumple = new Date(hoy.getFullYear() + 1, m - 1, d)

        const diff = Math.ceil((cumple - hoy) / (1000 * 60 * 60 * 24))
        return diff
      } catch {
        return null
      }
    }

    // =====================
    // SET NACIMIENTO
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
      if (!text) return m.reply('✏️ Uso:\n.bio Hola 😎')
      user.bio = text.trim()
      return m.reply('✅ Biografía guardada.')
    }

    // =====================
    // PERFIL
    // =====================
    if (command === 'perfil') {

      const nacimiento = user.birth || 'No registrado'
      const bio = user.bio || 'Sin biografía'

      const edad = user.birth ? calcularEdad(user.birth) : null
      const edadTexto = edad !== null ? `${edad} años` : 'No disponible'

      const dias = user.birth ? diasParaCumple(user.birth) : null
      let cumpleTexto = 'No disponible'

      if (dias !== null) {
        if (dias === 0) cumpleTexto = '🎉 Hoy es su cumpleaños'
        else cumpleTexto = `${dias} días`
      }

      // =====================
      // OWNER
      // =====================
      const senderNumber = jid.replace(/[^0-9]/g, '')

      const ownerNumbers = (global.owner || []).map(v => {
        if (Array.isArray(v)) v = v[0]
        return String(v).replace(/[^0-9]/g, '')
      })

      const isOwner = ownerNumbers.includes(senderNumber)

      // =====================
      // ADMIN
      // =====================
      let isAdmin = false

      if (m.isGroup) {
        try {
          const metadata = await conn.groupMetadata(m.chat)

          const participante = metadata.participants.find(p => {
            const id = conn.decodeJid ? conn.decodeJid(p.id) : p.id
            const num = id.replace(/[^0-9]/g, '')
            return num === senderNumber
          })

          if (participante?.admin) isAdmin = true
        } catch {}
      }

      // =====================
      // INSIGNIAS AUTOMÁTICAS
      // =====================
      let insignias = []

      if (isOwner) insignias.push('👑 Dueño del Bot')
      if (isAdmin) insignias.push('🛡️ Administrador')
      if (bio && bio !== 'Sin biografía') insignias.push('📝 Perfil Completo')

      if (dias === 0) insignias.push('🎂 Cumpleañero')

      // Usuario nuevo (< 7 días)
      const diasRegistro = Math.floor((Date.now() - user.registered) / 86400000)
      if (diasRegistro <= 7) insignias.push('🌱 Nuevo')

      // Usuario activo (si tiene datos guardados)
      if (user.birth || user.bio) insignias.push('⚡ Activo')

      if (!insignias.length) insignias.push('Ninguna')

      // =====================
      // ROL
      // =====================
      let rol = 'Usuario 👤'

      if (isOwner && isAdmin) rol = 'Dueño 👑 | Admin 🛡️'
      else if (isOwner) rol = 'Dueño 👑'
      else if (isAdmin) rol = 'Admin 🛡️'

      // =====================
      // TEXTO PERFIL
      // =====================
      const textoPerfil = `
👤 *PERFIL DE USUARIO*

🆔 Usuario: @${username}
⭐ Rol: ${rol}

🏅 Insignias:
${insignias.join('\n')}

🎂 Nacimiento: ${nacimiento}
🎉 Edad: ${edadTexto}
🎂 Cumple en: ${cumpleTexto}

📝 Bio: ${bio}

📅 Hoy: ${new Date().toLocaleDateString()}
`.trim()

      // =====================
      // FOTO PERFIL
      // =====================
      let ppUrl = null

      try {
        ppUrl = await conn.profilePictureUrl(jid, 'image')
      } catch {}

      if (ppUrl) {
        await conn.sendMessage(m.chat, {
          image: { url: ppUrl },
          caption: textoPerfil,
          mentions: [jid]
        }, { quoted: m })
      } else {
        await conn.sendMessage(m.chat, {
          text: textoPerfil,
          mentions: [jid]
        }, { quoted: m })
      }
    }

  } catch (err) {
    console.error('Perfil error:', err)
    m.reply('⚠️ Error al cargar el perfil.')
  }
}

handler.command = ['perfil', 'setbr', 'bio']
handler.tags = ['info']
handler.help = ['perfil', 'setbr', 'bio']

export default handler
