// 📂 plugins/perfil.js

let handler = async (m, { conn, text, command }) => {
  try {

    const jid = conn.decodeJid ? conn.decodeJid(m.sender) : m.sender
    const username = jid.split('@')[0]

    // =====================
    // DB SEGURA
    // =====================
    global.db.data = global.db.data || {}
    global.db.data.users = global.db.data.users || {}
    global.db.data.users[jid] = global.db.data.users[jid] || {}

    let user = global.db.data.users[jid]

    // =====================
    // CALCULAR EDAD
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

      // =====================
      // OWNER DETECCIÓN REAL
      // =====================
      const senderNumber = jid.replace(/[^0-9]/g, '')

      const ownerNumbers = (global.owner || []).map(v => {
        if (Array.isArray(v)) v = v[0]
        return String(v).replace(/[^0-9]/g, '')
      })

      const isOwner = ownerNumbers.includes(senderNumber)

      // =====================
      // ADMIN DETECCIÓN REAL
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
      // ROL FINAL
      // =====================
      let rol = 'Usuario 👤'

      if (isOwner && isAdmin) rol = 'Dueño del bot 👑 | Admin 🛡️'
      else if (isOwner) rol = 'Dueño del bot 👑'
      else if (isAdmin) rol = 'Admin 🛡️'

      // =====================
      // TEXTO PERFIL
      // =====================
      const textoPerfil = `
👤 *PERFIL DE USUARIO*

🆔 Usuario: @${username}
⭐ Rol: ${rol}

🎂 Nacimiento: ${nacimiento}
🎉 Edad: ${edadTexto}

📝 Bio: ${bio}

📅 Hoy: ${new Date().toLocaleDateString()}
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
      // ENVÍO
      // =====================
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
