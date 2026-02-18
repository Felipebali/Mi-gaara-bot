// 📂 plugins/perfil.js — PERFIL FelixCat 🐾 ROLES + INSIGNIAS (Owners solo para insignias)

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
        insignias: []
      }
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
        const hoyBase = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
        let cumple = new Date(hoy.getFullYear(), m - 1, d)
        if (cumple < hoyBase) cumple = new Date(hoy.getFullYear() + 1, m - 1, d)
        return Math.floor((cumple - hoyBase) / 86400000)
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
    // OWNER DETECCION
    // =====================
    const senderNumber = jid.replace(/[^0-9]/g, '')
    const ownerNumbers = (global.owner || []).map(v => {
      if (Array.isArray(v)) v = v[0]
      return String(v).replace(/[^0-9]/g, '')
    })
    const isRealOwner = ownerNumbers.includes(senderNumber)

    // =====================
    // ADMIN DETECCION
    // =====================
    let isAdmin = false
    if (m.isGroup) {
      try {
        const meta = await conn.groupMetadata(m.chat)
        const p = meta.participants.find(u => {
          const id = conn.decodeJid ? conn.decodeJid(u.id) : u.id
          return id === jid
        })
        if (p && (p.admin === 'admin' || p.admin === 'superadmin'))
          isAdmin = true
      } catch {}
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
    // SOLO OWNERS PARA INSIGNIAS
    // =====================
    if (command === 'otorgar') {
      if (!isRealOwner) return m.reply('❌ Solo los dueños del bot pueden usar este comando.')

      const target = getTarget()
      if (!target) return m.reply('✏️ Menciona o responde.')
      const nombre = text.replace(/@\d+/g, '').trim()
      if (!nombre) return m.reply('✏️ Escribe la insignia.')

      if (!global.db.data.users[target]) global.db.data.users[target] = { registered: Date.now(), insignias: [] }

      let tu = global.db.data.users[target]
      if (!tu.insignias) tu.insignias = []

      if (!tu.insignias.includes(nombre)) tu.insignias.push(nombre)

      return conn.reply(
        m.chat,
        `🏅 Insignia otorgada\n\n👤 @${target.split('@')[0]}\n🎖️ ${nombre}`,
        m,
        { mentions: [target] }
      )
    }

    if (command === 'quitar') {
      if (!isRealOwner) return m.reply('❌ Solo los dueños del bot pueden usar este comando.')

      const target = getTarget()
      if (!target) return m.reply('✏️ Menciona o responde.')
      const nombre = text.replace(/@\d+/g, '').trim()
      let tu = global.db.data.users[target]

      if (!tu || !tu.insignias || !tu.insignias.length) return m.reply('No tiene insignias.')

      tu.insignias = tu.insignias.filter(i => i.toLowerCase() !== nombre.toLowerCase())
      return m.reply('✅ Insignia eliminada.')
    }

    if (command === 'verinsignias') {
      if (!isRealOwner) return m.reply('❌ Solo los dueños del bot pueden usar este comando.')

      const target = getTarget() || jid
      let tu = global.db.data.users[target]

      if (!tu || !tu.insignias || !tu.insignias.length) return m.reply('No tiene insignias.')

      return conn.reply(
        m.chat,
        `🏅 Insignias de @${target.split('@')[0]}\n\n${tu.insignias.join('\n')}`,
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
      const edadTexto = edad !== null ? edad + ' años' : 'No disponible'
      const dias = user.birth ? diasParaCumple(user.birth) : null
      let cumpleTexto = 'No disponible'

      if (dias !== null) {
        if (dias === 0) cumpleTexto = '🎉 Hoy es su cumpleaños'
        else if (dias === 1) cumpleTexto = '⏳ Falta 1 día'
        else cumpleTexto = '⏳ Faltan ' + dias + ' días'
      }

      // INSIGNIAS AUTOMATICAS
      let insignias = []
      if (isRealOwner) insignias.push('👑 Dueño del Bot')
      if (isAdmin) insignias.push('🛡️ Administrador')
      if (user.insignias && user.insignias.length) insignias.push(...user.insignias)
      if (!insignias.length) insignias.push('Ninguna')

      // ROL
      let rol = 'Usuario 👤'
      if (isRealOwner && isAdmin) rol = 'Dueño 👑 | Admin 🛡️'
      else if (isRealOwner) rol = 'Dueño 👑'
      else if (isAdmin) rol = 'Admin 🛡️'

      const txt = `
👤 *PERFIL DE USUARIO*

🆔 @${username}
⭐ Rol: ${rol}

🏅 Insignias:
${insignias.join('\n')}

🎂 Nacimiento: ${nacimiento}
🎉 Edad: ${edadTexto}
🎂 Cumple en: ${cumpleTexto}

📝 Bio: ${bio}
`.trim()

      let pp = null
      try { pp = await conn.profilePictureUrl(jid, 'image') } catch {}

      if (pp) {
        await conn.sendMessage(m.chat, {
          image: { url: pp },
          caption: txt,
          mentions: [jid]
        }, { quoted: m })
      } else {
        await conn.sendMessage(m.chat, {
          text: txt,
          mentions: [jid]
        }, { quoted: m })
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
