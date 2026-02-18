// 📂 plugins/perfil.js — PERFIL FelixCat 🐾 INSIGNIAS + CUMPLE FIX

let handler = async (m, { conn, text, command, isOwner }) => {
  try {

    const jid = conn.decodeJid ? conn.decodeJid(m.sender) : m.sender
    const username = jid.split('@')[0]

    // =====================
    // DB SEGURA
    // =====================
    global.db.data ||= {}
    global.db.data.users ||= {}
    global.db.data.users[jid] ||= {
      registered: Date.now(),
      insignias: []
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
        const hoySinHora = new Date(
          hoy.getFullYear(),
          hoy.getMonth(),
          hoy.getDate()
        )

        let cumple = new Date(hoy.getFullYear(), m - 1, d)

        if (cumple < hoySinHora)
          cumple = new Date(hoy.getFullYear() + 1, m - 1, d)

        return Math.floor((cumple - hoySinHora) / 86400000)
      } catch {
        return null
      }
    }

    // =====================
    // FUNCION TARGET
    // =====================
    const getTarget = () => {
      if (m.mentionedJid?.length)
        return m.mentionedJid[0]

      if (m.quoted?.sender)
        return m.quoted.sender

      return null
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
    // OTORGAR
    // =====================
    if (command === 'otorgar') {

      if (!isOwner)
        return m.reply('❌ Solo los dueños del bot pueden otorgar insignias.')

      const target = getTarget()
      if (!target)
        return m.reply('✏️ Menciona o responde al usuario.')

      const nombre = text.replace(/@\d+/g, '').trim()
      if (!nombre)
        return m.reply('✏️ Escribe el nombre de la insignia.')

      global.db.data.users[target] ||= {
        registered: Date.now(),
        insignias: []
      }

      let targetUser = global.db.data.users[target]
      targetUser.insignias ||= []

      if (!targetUser.insignias.includes(nombre))
        targetUser.insignias.push(nombre)

      return conn.reply(
        m.chat,
        `🏅 Insignia otorgada\n\n👤 @${target.split('@')[0]}\n🎖️ ${nombre}`,
        m,
        { mentions: [target] }
      )
    }

    // =====================
    // QUITAR
    // =====================
    if (command === 'quitar') {

      if (!isOwner)
        return m.reply('❌ Solo los dueños del bot pueden quitar insignias.')

      const target = getTarget()
      if (!target)
        return m.reply('✏️ Menciona o responde al usuario.')

      const nombre = text.replace(/@\d+/g, '').trim()
      if (!nombre)
        return m.reply('✏️ Escribe la insignia a quitar.')

      let targetUser = global.db.data.users[target]
      if (!targetUser?.insignias?.length)
        return m.reply('Este usuario no tiene insignias.')

      targetUser.insignias =
        targetUser.insignias.filter(i =>
          i.toLowerCase() !== nombre.toLowerCase()
        )

      return m.reply('✅ Insignia eliminada.')
    }

    // =====================
    // VER INSIGNIAS
    // =====================
    if (command === 'verinsignias') {

      const target = getTarget() || jid

      let targetUser = global.db.data.users[target]
      if (!targetUser?.insignias?.length)
        return m.reply('No tiene insignias.')

      return conn.reply(
        m.chat,
        `🏅 Insignias de @${target.split('@')[0]}\n\n${targetUser.insignias.join('\n')}`,
        m,
        { mentions: [target] }
      )
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
        else if (dias === 1) cumpleTexto = '⏳ Falta 1 día'
        else cumpleTexto = `⏳ Faltan ${dias} días`
      }

      // OWNER
      const senderNumber = jid.replace(/[^0-9]/g, '')

      const ownerNumbers = (global.owner || []).map(v => {
        if (Array.isArray(v)) v = v[0]
        return String(v).replace(/[^0-9]/g, '')
      })

      const isRealOwner = ownerNumbers.includes(senderNumber)

      // ADMIN
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

      // INSIGNIAS
      user.insignias ||= []

      let insignias = []

      if (isRealOwner) insignias.push('👑 Dueño del Bot')
      if (isAdmin) insignias.push('🛡️ Administrador')

      if (user.insignias.length)
        insignias.push(...user.insignias)

      if (!insignias.length)
        insignias.push('Ninguna')

      // ROL
      let rol = 'Usuario 👤'

      if (isRealOwner && isAdmin) rol = 'Dueño 👑 | Admin 🛡️'
      else if (isRealOwner) rol = 'Dueño 👑'
      else if (isAdmin) rol = 'Admin 🛡️'

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
    console.error(err)
    m.reply('⚠️ Error en perfil.')
  }
}

handler.command = [
  'perfil',
  'setbr',
  'bio',
  'otorgar',
  'quitar',
  'verinsignias'
]

handler.tags = ['info']
handler.help = [
  'perfil',
  'setbr 31/12/1998',
  'bio texto',
  'otorgar @user Insignia',
  'quitar @user Insignia',
  'verinsignias @user'
]

export default handler
