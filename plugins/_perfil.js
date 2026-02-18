// 📂 plugins/perfil.js — PERFIL FelixCat 🐾 FINAL FIX

let handler = async (m, { conn, text, command }) => {
  try {

    const jid = conn.decodeJid ? conn.decodeJid(m.sender) : m.sender
    const username = jid.split('@')[0]

    // =====================
    // DATABASE
    // =====================

    if (!global.db.data) global.db.data = {}
    if (!global.db.data.users) global.db.data.users = {}

    if (!global.db.data.users[jid]) {
      global.db.data.users[jid] = {
        registered: Date.now(),
        joinGroup: null,
        insignias: [],
        mensajes: 0
      }
    }

    let user = global.db.data.users[jid]

    // =====================
    // CONTADOR MENSAJES
    // =====================

    user.mensajes = (user.mensajes || 0) + 1

    // =====================
    // FECHA INGRESO GRUPO FIX
    // =====================

    if (m.isGroup && (!user.joinGroup || user.joinGroup < 1000000000000)) {
      user.joinGroup = Date.now()
    }

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
        if (cumple < hoy) cumple.setFullYear(hoy.getFullYear() + 1)
        return Math.ceil((cumple - hoy) / 86400000)
      } catch {
        return null
      }
    }

    // =====================
    // TARGET
    // =====================

    const getTarget = () => {
      if (m.mentionedJid && m.mentionedJid.length) return m.mentionedJid[0]
      if (m.quoted && m.quoted.sender) return m.quoted.sender
      return null
    }

    // =====================
    // OWNER
    // =====================

    const senderNumber = jid.replace(/[^0-9]/g, '')

    const ownerNumbers = (global.owner || []).map(v => {
      if (Array.isArray(v)) v = v[0]
      return String(v).replace(/[^0-9]/g, '')
    })

    const isRealOwner = ownerNumbers.includes(senderNumber)

    // =====================
    // ADMIN FIX REAL
    // =====================

    let isAdmin = false

    if (m.isGroup) {
      try {

        const metadata = await conn.groupMetadata(m.chat)

        const participants = metadata.participants || []

        const userId = conn.decodeJid
          ? conn.decodeJid(m.sender)
          : m.sender

        const participant = participants.find(p => {
          const id = conn.decodeJid
            ? conn.decodeJid(p.id)
            : p.id
          return id === userId
        })

        if (participant) {
          isAdmin =
            participant.admin === 'admin' ||
            participant.admin === 'superadmin'
        }

      } catch (e) {
        console.log('Error admin:', e)
      }
    }

    // =====================
    // COMANDOS
    // =====================

    if (command === 'setbr') {
      if (!text) return m.reply('✏️ Uso:\n.setbr 31/12/1998')
      user.birth = text.trim()
      return m.reply('✅ Fecha guardada.')
    }

    if (command === 'bio') {
      if (!text) return m.reply('✏️ Uso:\n.bio texto')
      user.bio = text.trim()
      return m.reply('✅ Bio guardada.')
    }

    // =====================
    // OTORGAR INSIGNIA
    // =====================

    if (command === 'otorgar') {

      if (!isRealOwner)
        return m.reply('❌ Solo los dueños pueden usar este comando.')

      const target = getTarget()
      if (!target) return m.reply('✏️ Menciona o responde al usuario.')

      const nombre = text.replace(/@\d+/g, '').trim()
      if (!nombre) return m.reply('✏️ Escribe la insignia.')

      if (!global.db.data.users[target]) {
        global.db.data.users[target] = {
          registered: Date.now(),
          joinGroup: null,
          insignias: [],
          mensajes: 0
        }
      }

      let tu = global.db.data.users[target]

      if (!tu.insignias) tu.insignias = []

      if (!tu.insignias.includes(nombre))
        tu.insignias.push(nombre)

      return conn.reply(
        m.chat,
        `🏅 Insignia otorgada\n\n👤 @${target.split('@')[0]}\n🎖️ ${nombre}`,
        m,
        { mentions: [target] }
      )
    }

    // =====================
    // QUITAR TODAS LAS INSIGNIAS
    // =====================

    if (command === 'quitar') {

      if (!isRealOwner)
        return m.reply('❌ Solo los dueños pueden usar este comando.')

      const target = getTarget()
      if (!target) return m.reply('✏️ Menciona o responde al usuario.')

      let tu = global.db.data.users[target]

      if (!tu || !tu.insignias || !tu.insignias.length)
        return m.reply('❌ Ese usuario no tiene insignias.')

      const cantidad = tu.insignias.length
      tu.insignias = []

      return conn.reply(
        m.chat,
        `🗑️ Se eliminaron *${cantidad}* insignias\n\n👤 @${target.split('@')[0]}`,
        m,
        { mentions: [target] }
      )
    }

    // =====================
    // VER INSIGNIAS GLOBAL
    // =====================

    if (command === 'verinsignias') {

      if (!isRealOwner)
        return m.reply('❌ Solo los dueños pueden usar este comando.')

      let lista = []
      let mentions = []

      for (let id in global.db.data.users) {

        let u = global.db.data.users[id]

        if (u.insignias && u.insignias.length) {

          lista.push(
            `👤 @${id.split('@')[0]}\n🏅 ${u.insignias.join(', ')}`
          )

          mentions.push(id)
        }
      }

      if (!lista.length)
        return m.reply('❌ Nadie tiene insignias.')

      return conn.reply(
        m.chat,
        `🏅 *USUARIOS CON INSIGNIAS*\n\n${lista.join('\n\n')}`,
        m,
        { mentions }
      )
    }

    // =====================
    // PERFIL
    // =====================

    if (command === 'perfil') {

      const nacimiento = user.birth || 'No registrado'
      const bio = user.bio || 'Sin biografía'

      const edad = user.birth ? calcularEdad(user.birth) : null
      const edadTexto = edad !== null ? edad + ' años' : 'No disponible'

      const dias = user.birth ? diasParaCumple(user.birth) : null

      let cumpleTexto = 'No disponible'

      if (dias !== null) {
        if (dias <= 0) cumpleTexto = '🎉 Hoy'
        else cumpleTexto = `⏳ ${dias} días`
      }

      // INSIGNIAS AUTO

      let insignias = []

      if (isRealOwner) insignias.push('👑 Dueño')
      if (isAdmin) insignias.push('🛡️ Admin')

      if (user.insignias && user.insignias.length)
        insignias.push(...user.insignias)

      if (!insignias.length) insignias.push('Ninguna')

      // ROL

      let rol = 'Usuario 👤'

      if (isRealOwner && isAdmin) rol = 'Dueño 👑 | Admin 🛡️'
      else if (isRealOwner) rol = 'Dueño 👑'
      else if (isAdmin) rol = 'Admin 🛡️'

      // INGRESO

      let ingresoTexto = 'No disponible'

      if (user.joinGroup) {
        const ingreso = new Date(user.joinGroup)
        const hoy = new Date()
        const diasGrupo = Math.floor((hoy - ingreso) / 86400000)

        ingresoTexto =
          `${ingreso.toLocaleDateString()} (${diasGrupo} días)`
      }

      // TEXTO

      const txt = `
👤 *PERFIL DE USUARIO*

🆔 @${username}
⭐ Rol: ${rol}

🏅 Insignias:
${insignias.join('\n')}

🎂 Nacimiento: ${nacimiento}
🎉 Edad: ${edadTexto}
🎂 Cumple en: ${cumpleTexto}

📥 Ingreso: ${ingresoTexto}
✉️ Mensajes: ${user.mensajes}

📝 Bio: ${bio}
`.trim()

      let pp = null
      try {
        pp = await conn.profilePictureUrl(jid, 'image')
      } catch {}

      if (pp) {
        await conn.sendMessage(
          m.chat,
          {
            image: { url: pp },
            caption: txt,
            mentions: [jid]
          },
          { quoted: m }
        )
      } else {
        await conn.sendMessage(
          m.chat,
          {
            text: txt,
            mentions: [jid]
          },
          { quoted: m }
        )
      }
    }

  } catch (e) {
    console.error(e)
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
