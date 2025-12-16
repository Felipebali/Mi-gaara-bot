// 📂 plugins/mods-ban.js — FELI 2025
// Sistema completo de BAN / UNBAN / HORABAN / BLOCK

const handler = async (m, {
  conn, text, usedPrefix, command, args,
  isROwner, isOwner, isFernando
}) => {

  const botNumber = conn.user.jid.split('@')[0]
  const users = global.db.data.users
  const chats = global.db.data.chats

  // ──────────────── UTILIDADES ────────────────

  const cleanNumber = (n = '') =>
    n.replace(/\s/g, '').replace(/[@+-]/g, '')

  const isProtected = jid =>
    global.owner.some(o => (Array.isArray(o) ? o[0] : o) + '@s.whatsapp.net' === jid)

  // ⏱️ Parsear tiempo (2h 30m 1d 1mes etc)
  function parseTime(str = '') {
    const reg = /(\d+)\s*(s|seg|m|min|h|hora|d|dia|mes|y|año)/gi
    let ms = 0
    for (const [, n, u] of str.matchAll(reg)) {
      const v = parseInt(n)
      if (u.startsWith('s')) ms += v * 1000
      else if (u.startsWith('m') && !u.includes('mes')) ms += v * 60000
      else if (u.startsWith('h')) ms += v * 3600000
      else if (u.startsWith('d')) ms += v * 86400000
      else if (u.includes('mes')) ms += v * 2592000000
      else ms += v * 31536000000
    }
    return ms || null
  }

  const formatTime = ms => {
    if (ms <= 0) return '0 segundos'
    const t = [
      ['año', 31536000000],
      ['mes', 2592000000],
      ['día', 86400000],
      ['hora', 3600000],
      ['minuto', 60000],
      ['segundo', 1000]
    ]
    let out = []
    for (const [n, v] of t) {
      const c = Math.floor(ms / v)
      if (c > 0) {
        out.push(`${c} ${n}${c > 1 ? 's' : ''}`)
        ms -= c * v
      }
    }
    return out.join(', ')
  }

  // 🧹 Limpiar baneos vencidos
  const cleanExpired = () => {
    const now = Date.now()
    for (const u in users) {
      if (users[u].banned && users[u].bannedUntil && now >= users[u].bannedUntil) {
        users[u].banned = false
        users[u].bannedUntil = null
        users[u].bannedReason = ''
        users[u].bannedBy = ''
      }
    }
  }

  // ──────────────── START ────────────────

  try {
    cleanExpired()

    // ───── HORABAN (USUARIOS) ─────
    if (command === 'horaban') {
      const u = users[m.sender]
      if (!u || !u.banned)
        return conn.reply(m.chat, '✅ No estás baneado.', m)

      const timeLeft = u.bannedUntil ? u.bannedUntil - Date.now() : null
      return conn.reply(m.chat, `
╭━〔🚫 *ESTADO DE BANEO*〕━╮
┃ 👤 Usuario: ${await conn.getName(m.sender)}
┃ 📝 Razón: ${u.bannedReason || 'Sin especificar'}
┃ 🚫 Baneado por: ${u.bannedBy || 'Admin'}
┃
┃ ⏱️ Tiempo restante:
┃ ${timeLeft ? formatTime(timeLeft) : 'PERMANENTE'}
╰━━━━━━━━━━━━╯`, m)
    }

    // ───── PERMISOS ─────
    if (['banned', 'unban'].includes(command)) {
      if (!isFernando && !isROwner)
        return conn.reply(m.chat,
          '🔐 Comando exclusivo del desarrollador.', m)
    } else if (!isOwner) {
      return conn.reply(m.chat,
        '❌ Solo propietarios del bot.', m)
    }

    // ───── TARGET ─────
    const who =
      m.mentionedJid?.[0] ||
      m.quoted?.sender ||
      (text ? cleanNumber(text.split(' ')[0]) + '@s.whatsapp.net' : null)

    if (!who && command !== 'banlist' && command !== 'blocklist')
      return conn.reply(m.chat, '⚠️ Usuario inválido.', m)

    // ──────────────── COMANDOS ────────────────

    switch (command) {

      case 'banned': {
        if (who === conn.user.jid)
          return conn.reply(m.chat, '🤖 No puedo banearme.', m)

        if (isProtected(who))
          return conn.reply(m.chat, '🛡️ Usuario protegido.', m)

        const extra = args.join(' ').replace(/@\d+/g, '')
        const time = parseTime(extra)
        const reason = extra.replace(/\d+\s*\w+/g, '').trim() || 'Sin especificar'

        users[who] ??= {}
        if (users[who].banned)
          return conn.reply(m.chat, '⚠️ Ya está baneado.', m)

        users[who].banned = true
        users[who].bannedUntil = time ? Date.now() + time : null
        users[who].bannedReason = reason
        users[who].bannedBy = await conn.getName(m.sender)

        await conn.reply(m.chat, `
╭━〔🚫 *USUARIO BANEADO*〕━╮
┃ 👤 ${await conn.getName(who)}
┃ 📝 ${reason}
┃ ⏱️ ${time ? formatTime(time) : 'PERMANENTE'}
╰━━━━━━━━━━━━╯`, m, { mentions: [who] })

        break
      }

      case 'unban': {
        if (!users[who]?.banned)
          return conn.reply(m.chat, '⚠️ No está baneado.', m)

        users[who].banned = false
        users[who].bannedUntil = null
        users[who].bannedReason = ''
        users[who].bannedBy = ''

        await conn.reply(m.chat, `
╭━〔✅ *DESBANEADO*〕━╮
┃ 👤 ${await conn.getName(who)}
╰━━━━━━━━━━━━╯`, m, { mentions: [who] })
        break
      }

      case 'checkban': {
        const u = users[who]
        if (!u?.banned)
          return conn.reply(m.chat, '✅ No está baneado.', m)

        const left = u.bannedUntil ? u.bannedUntil - Date.now() : null
        await conn.reply(m.chat, `
╭━〔🚫 *CHECK BAN*〕━╮
┃ 👤 ${await conn.getName(who)}
┃ 📝 ${u.bannedReason}
┃ ⏱️ ${left ? formatTime(left) : 'PERMANENTE'}
╰━━━━━━━━━━━━╯`, m, { mentions: [who] })
        break
      }

      case 'block':
        await conn.updateBlockStatus(who, 'block')
        return conn.reply(m.chat, '🚫 Usuario bloqueado.', m)

      case 'unblock':
        await conn.updateBlockStatus(who, 'unblock')
        return conn.reply(m.chat, '✅ Usuario desbloqueado.', m)

      case 'banlist': {
        const list = Object.entries(users)
          .filter(([, u]) => u.banned)
          .map(([j, u]) =>
            `▢ @${j.split('@')[0]} → ${u.bannedUntil ? formatTime(u.bannedUntil - Date.now()) : 'PERMA'}`
          )

        return conn.reply(m.chat,
          `📋 *BANEADOS*\n\n${list.join('\n') || 'Ninguno'}`, m,
          { mentions: list.map(v => v.split('@')[1]?.split(' ')[0] + '@s.whatsapp.net') })
      }

      case 'blocklist': {
        const bl = await conn.fetchBlocklist()
        return conn.reply(m.chat,
          `📋 *BLOQUEADOS*\n\n${bl.map(j => '▢ @' + j.split('@')[0]).join('\n')}`,
          m, { mentions: bl })
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
