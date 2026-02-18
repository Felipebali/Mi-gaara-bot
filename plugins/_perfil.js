// 📂 plugins/perfil.js — PERFIL FelixCat 🐾 ULTRA FIX

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
    // CONTADOR MENSAJES GLOBAL
    // =====================

    user.mensajes = (user.mensajes || 0) + 1

    // =====================
    // FECHA INGRESO GRUPO
    // =====================

    if (m.isGroup && !user.joinGroup) {
      user.joinGroup = Date.now()
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
    // ADMIN REAL FIX
    // =====================

    let isAdmin = false

    if (m.isAdmin !== undefined) {
      isAdmin = m.isAdmin
    } else if (m.isGroup) {
      try {
        const meta = await conn.groupMetadata(m.chat)
        const participant = meta.participants.find(p =>
          (conn.decodeJid ? conn.decodeJid(p.id) : p.id) === jid
        )
        if (participant) {
          isAdmin =
            participant.admin === 'admin' ||
            participant.admin === 'superadmin'
        }
      } catch {}
    }

    // =====================
    // FUNCIONES FECHA
    // =====================

    const calcularEdad = (fecha) => {
      const [d, m, a] = fecha.split('/').map(Number)
      if (!d || !m || !a) return null
      const nacimiento = new Date(a, m - 1, d)
      const hoy = new Date()
      let edad = hoy.getFullYear() - nacimiento.getFullYear()
      const diff = hoy.getMonth() - nacimiento.getMonth()
      if (diff < 0 || (diff === 0 && hoy.getDate() < nacimiento.getDate()))
        edad--
      return edad
    }

    const diasParaCumple = (fecha) => {
      const [d, m] = fecha.split('/').map(Number)
      if (!d || !m) return null
      const hoy = new Date()
      let cumple = new Date(hoy.getFullYear(), m - 1, d)
      if (cumple < hoy) cumple.setFullYear(hoy.getFullYear() + 1)
      return Math.ceil((cumple - hoy) / 86400000)
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

    if (command === 'otorgar') {

      if (!isRealOwner)
        return m.reply('❌ Solo los dueños.')

      const target = getTarget()
      if (!target) return m.reply('✏️ Menciona usuario.')

      const nombre = text.replace(/@\d+/g, '').trim()
      if (!nombre) return m.reply('✏️ Escribe insignia.')

      if (!global.db.data.users[target])
        global.db.data.users[target] = { insignias: [] }

      let tu = global.db.data.users[target]

      if (!tu.insignias) tu.insignias = []

      if (!tu.insignias.includes(nombre))
        tu.insignias.push(nombre)

      return conn.reply(
        m.chat,
        `🏅 Insignia otorgada\n👤 @${target.split('@')[0]}\n🎖️ ${nombre}`,
        m,
        { mentions: [target] }
      )
    }

    if (command === 'quitar') {

      if (!isRealOwner)
        return m.reply('❌ Solo los dueños.')

      const target = getTarget()
      if (!target) return m.reply('✏️ Menciona usuario.')

      let tu = global.db.data.users[target]

      if (!tu || !tu.insignias?.length)
        return m.reply('❌ No tiene insignias.')

      tu.insignias = []

      return conn.reply(
        m.chat,
        `🗑️ Insignias eliminadas\n👤 @${target.split('@')[0]}`,
        m,
        { mentions: [target] }
      )
    }

    if (command === 'verinsignias') {

      if (!isRealOwner)
        return m.reply('❌ Solo los dueños.')

      let lista = []
      let mentions = []

      for (let id in global.db.data.users) {
        let u = global.db.data.users[id]
        if (u.insignias?.length) {
          lista.push(`👤 @${id.split('@')[0]}\n🏅 ${u.insignias.join(', ')}`)
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
      if (dias !== null)
        cumpleTexto = dias <= 0 ? '🎉 Hoy' : `⏳ ${dias} días`

      // INSIGNIAS

      let insignias = []

      if (isRealOwner) insignias.push('👑 Dueño')
      else if (isAdmin) insignias.push('🛡️ Admin')

      if (user.insignias?.length)
        insignias.push(...user.insignias)

      if (!insignias.length) insignias.push('Ninguna')

      // ROL

      let rol = 'Usuario 👤'

      if (isRealOwner) rol = 'Dueño 👑'
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

      await conn.sendMessage(
        m.chat,
        pp
          ? { image: { url: pp }, caption: txt, mentions: [jid] }
          : { text: txt, mentions: [jid] },
        { quoted: m }
      )
    }

  } catch (e) {
    console.error(e)
  }
}

// 👇 IMPORTANTE PARA CONTAR TODOS LOS MENSAJES
handler.all = true

handler.command = [
  'perfil',
  'setbr',
  'bio',
  'otorgar',
  'quitar',
  'verinsignias'
]

export default handler
