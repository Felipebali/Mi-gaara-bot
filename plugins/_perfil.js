// 📂 plugins/perfil.js — PERFIL FelixCat 🐾 FULL FIX

let handler = async (m, { conn, text, usedPrefix }) => {
  try {

    const jid = conn.decodeJid ? conn.decodeJid(m.sender) : m.sender
    const username = jid.split('@')[0]

    // =====================
    // DETECTAR COMANDO REAL
    // =====================
    const body = m.text || ''
    const command =
      body.replace(usedPrefix, '').trim().split(' ')[0].toLowerCase()

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
        const partes = fecha.split('/')
        if (partes.length < 2) return null

        const d = Number(partes[0])
        const m = Number(partes[1])

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

      // INSIGNIAS
      user.insignias ||= []

      let insignias = user.insignias.length
        ? user.insignias.join('\n')
        : 'Ninguna'

      const textoPerfil = `
👤 *PERFIL DE USUARIO*

🆔 Usuario: @${username}

🏅 Insignias:
${insignias}

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

export default handler
