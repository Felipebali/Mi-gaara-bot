// 📂 plugins/mods-ban.js — FELI 2025 (FIXED)
// Sistema completo de BAN / UNBAN / HORABAN / BLOCK
// ✔ Compatible Node viejo / loaders MD

const handler = async (m, {
  conn, text, usedPrefix, command, args,
  isROwner, isOwner, isFernando
}) => {

  const users = global.db.data.users || {}

  // ───────── UTILIDADES ─────────

  const cleanNumber = (n) => {
    if (!n) return ''
    return n.replace(/\s/g, '').replace(/[@+-]/g, '')
  }

  const isProtected = (jid) => {
    return global.owner.some(o => {
      const num = Array.isArray(o) ? o[0] : o
      return num + '@s.whatsapp.net' === jid
    })
  }

  // ⏱️ Parsear tiempo (SIN matchAll)
  function parseTime(str) {
    if (!str) return null
    let ms = 0
    const reg = /(\d+)\s*(s|seg|m|min|h|hora|d|dia|mes|y|año)/gi
    let match
    while ((match = reg.exec(str)) !== null) {
      const v = parseInt(match[1])
      const u = match[2]
      if (u.startsWith('s')) ms += v * 1000
      else if (u.startsWith('m') && !u.includes('mes')) ms += v * 60000
      else if (u.startsWith('h')) ms += v * 3600000
      else if (u.startsWith('d')) ms += v * 86400000
      else if (u.includes('mes')) ms += v * 2592000000
      else ms += v * 31536000000
    }
    return ms || null
  }

  const formatTime = (ms) => {
    if (!ms || ms <= 0) return '0 segundos'
    const t = [
      ['año', 31536000000],
      ['mes', 2592000000],
      ['día', 86400000],
      ['hora', 3600000],
      ['minuto', 60000],
      ['segundo', 1000]
    ]
    let out = []
    for (let i of t) {
      const c = Math.floor(ms / i[1])
      if (c > 0) {
        out.push(c + ' ' + i[0] + (c > 1 ? 's' : ''))
        ms -= c * i[1]
      }
    }
    return out.join(', ')
  }

  // 🧹 Limpiar baneos vencidos
  const cleanExpired = () => {
    const now = Date.now()
    for (let u in users) {
      if (users[u].banned && users[u].bannedUntil && now >= users[u].bannedUntil) {
        users[u].banned = false
        users[u].bannedUntil = null
        users[u].bannedReason = ''
        users[u].bannedBy = ''
      }
    }
  }

  // ───────── START ─────────

  try {
    cleanExpired()

    // ───── HORABAN ─────
    if (command === 'horaban') {
      const u = users[m.sender]
      if (!u || !u.banned)
        return conn.reply(m.chat, '✅ No estás baneado.', m)

      const timeLeft = u.bannedUntil ? u.bannedUntil - Date.now() : null
      return conn.reply(m.chat,
`╭━〔🚫 *ESTADO DE BANEO*〕━╮
┃ 👤 ${await conn.getName(m.sender)}
┃ 📝 ${u.bannedReason || 'Sin especificar'}
┃ 🚫 ${u.bannedBy || 'Admin'}
┃ ⏱️ ${timeLeft ? formatTime(timeLeft) : 'PERMANENTE'}
╰━━━━━━━━━━━━╯`, m)
    }

    // ───── PERMISOS ─────
    if (command === 'banned' || command === 'unban') {
      if (!isFernando && !isROwner)
        return conn.reply(m.chat, '🔐 Solo desarrollador.', m)
    } else if (!isOwner) {
      return conn.reply(m.chat, '❌ Solo owners.', m)
    }

    // ───── TARGET ─────
    let who = null
    if (m.mentionedJid && m.mentionedJid[0]) who = m.mentionedJid[0]
    else if (m.quoted && m.quoted.sender) who = m.quoted.sender
    else if (text) who = cleanNumber(text.split(' ')[0]) + '@s.whatsapp.net'

    if (!who && command !== 'banlist' && command !== 'blocklist')
      return conn.reply(m.chat, '⚠️ Usuario inválido.', m)

    // ───────── COMANDOS ─────────

    switch (command) {

      case 'banned': {
        if (who === conn.user.jid)
          return conn.reply(m.chat, '🤖 No puedo banearme.', m)

        if (isProtected(who))
          return conn.reply(m.chat, '🛡️ Usuario protegido.', m)

        const extra = args.join(' ').replace(/@\d+/g, '')
        const time = parseTime(extra)
        const reason = extra.replace(/\d+\s*\w+/g, '').trim() || 'Sin especificar'

        if (!users[who]) users[who] = {}

        if (users[who].banned)
          return conn.reply(m.chat, '⚠️ Ya está baneado.', m)

        users[who].banned = true
        users[who].bannedUntil = time ? Date.now() + time : null
        users[who].bannedReason = reason
        users[who].bannedBy = await conn.getName(m.sender)

        return conn.reply(m.chat,
`╭━〔🚫 *USUARIO BANEADO*〕━╮
┃ 👤 ${await conn.getName(who)}
┃ 📝 ${reason}
┃ ⏱️ ${time ? formatTime(time) : 'PERMANENTE'}
╰━━━━━━━━━━━━╯`, m, { mentions: [who] })
      }

      case 'unban': {
        if (!users[who] || !users[who].banned)
          return conn.reply(m.chat, '⚠️ No está baneado.', m)

        users[who].banned = false
        users[who].bannedUntil = null
        users[who].bannedReason = ''
        users[who].bannedBy = ''

        return conn.reply(m.chat,
`╭━〔✅ *DESBANEADO*〕━╮
┃ 👤 ${await conn.getName(who)}
╰━━━━━━━━━━━━╯`, m, { mentions: [who] })
      }

      case 'checkban': {
        if (!users[who] || !users[who].banned)
          return conn.reply(m.chat, '✅ No está baneado.', m)

        const left = users[who].bannedUntil
          ? users[who].bannedUntil - Date.now()
          : null

        return conn.reply(m.chat,
`╭━〔🚫 *CHECK BAN*〕━╮
┃ 👤 ${await conn.getName(who)}
┃ 📝 ${users[who].bannedReason}
┃ ⏱️ ${left ? formatTime(left) : 'PERMANENTE'}
╰━━━━━━━━━━━━╯`, m, { mentions: [who] })
      }

      case 'block':
        await conn.updateBlockStatus(who, 'block')
        return conn.reply(m.chat, '🚫 Usuario bloqueado.', m)

      case 'unblock':
        await conn.updateBlockStatus(who, 'unblock')
        return conn.reply(m.chat, '✅ Usuario desbloqueado.', m)

      case 'banlist': {
        let txt = '📋 *BANEADOS*\n\n'
        let ment = []
        for (let j in users) {
          if (users[j].banned) {
            txt += `▢ @${j.split('@')[0]} → ${
              users[j].bannedUntil
                ? formatTime(users[j].bannedUntil - Date.now())
                : 'PERMA'
            }\n`
            ment.push(j)
          }
        }
        return conn.reply(m.chat, txt || 'Ninguno', m, { mentions: ment })
      }

      case 'blocklist': {
        const bl = await conn.fetchBlocklist()
        return conn.reply(
          m.chat,
          '📋 *BLOQUEADOS*\n\n' + bl.map(j => '▢ @' + j.split('@')[0]).join('\n'),
          m,
          { mentions: bl }
        )
      }
    }

  } catch (e) {
    console.error(e)
    return conn.reply(m.chat, '❌ Error interno.', m)
  }
}

handler.help = ['banned', 'unban', 'checkban', 'horaban', 'block', 'unblock', 'banlist', 'blocklist']
handler.tags = ['mods']
handler.command = handler.help

export default handler
