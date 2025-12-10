// 📂 plugins/propietario-listanegra.js — AUTO-KICK TOTAL + AVISOS

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function normalizeJid(jid = '') {
  if (!jid) return null
  jid = jid.toString().trim().replace(/^\+/, '')
  if (jid.endsWith('@c.us') || jid.endsWith('@s.whatsapp.net'))
    return jid.replace(/@c.us$/, '@s.whatsapp.net')
  if (jid.includes('@')) return jid
  return jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
}

function digitsOnly(txt = '') {
  return txt.toString().replace(/[^0-9]/g, '')
}

function extractPhoneNumber(txt = '') {
  const d = digitsOnly(txt)
  if (!d || d.length < 5) return null
  return d
}

const handler = async (m, { conn, command, text }) => {
  const dbUsers = global.db.data.users || (global.db.data.users = {})
  const emoji = '🚫'
  const done = '✅'

  let userJid = null

  // 🔍 DETECCIÓN POR CITA
  if (m.quoted)
    userJid = normalizeJid(m.quoted.sender || m.quoted.participant)

  // 🔍 DETECCIÓN POR MENCIÓN
  else if (m.mentionedJid?.length)
    userJid = normalizeJid(m.mentionedJid[0])

  // 🔍 DETECCIÓN POR NÚMERO O POR ÍNDICE
  else if (text) {
    const num = extractPhoneNumber(text)
    if (num) {
      userJid = normalizeJid(num)
    } else if (!isNaN(text)) { // REMN por índice
      const banned = Object.entries(dbUsers).filter(([_, d]) => d.banned)
      const idx = parseInt(text) - 1
      if (banned[idx]) userJid = banned[idx][0]
    }
  }

  if (!userJid && !['listn', 'clrn'].includes(command))
    return conn.reply(m.chat, `${emoji} Debes responder, mencionar, poner número o usar índice.`, m)

  if (userJid && !dbUsers[userJid]) dbUsers[userJid] = {}

  let reason = text?.replace(/@/g, '').replace(/\d{5,}/g, '').trim()
  if (!reason) reason = 'No especificado'

  // ==========================================
  // 🚫 AGREGAR A LA LISTA NEGRA + EXPULSIÓN INMEDIATA
  // ==========================================
  if (command === 'addn') {
    dbUsers[userJid].banned = true
    dbUsers[userJid].banReason = reason
    dbUsers[userJid].bannedBy = m.sender

    await conn.sendMessage(m.chat, {
      text: `${done} @${userJid.split('@')[0]} añadido a *lista negra global*.\n📝 Motivo: ${reason}`,
      mentions: [userJid]
    })

    // 🔥 EXPULSIÓN TOTAL
    const groupsObj = await conn.groupFetchAllParticipating()
    const groups = Object.keys(groupsObj)

    for (const gid of groups) {
      await sleep(500)
      try {
        const meta = await conn.groupMetadata(gid)
        const member = meta.participants.find(p => normalizeJid(p.id) === userJid)
        if (!member) continue
        await conn.groupParticipantsUpdate(gid, [userJid], 'remove')
        await sleep(300)
        await conn.sendMessage(gid, {
          text: `🚫 @${userJid.split('@')[0]} fue eliminado automáticamente.\n📛 Está en *lista negra global*.\n📝 Motivo: ${reason}`,
          mentions: [userJid]
        })
      } catch {}
    }
  }

  // ==========================================
  // 🗑 REMOVER
  // ==========================================
  else if (command === 'remn') {
    if (!dbUsers[userJid]?.banned)
      return conn.sendMessage(m.chat, { text: `${emoji} No está en la lista negra.` })

    dbUsers[userJid].banned = false
    dbUsers[userJid].banReason = ''
    dbUsers[userJid].bannedBy = null

    await conn.sendMessage(m.chat, {
      text: `${done} @${userJid.split('@')[0]} eliminado de la *lista negra*.`,
      mentions: [userJid]
    })
  }

  // ==========================================
  // 📃 LISTAR
  // ==========================================
  else if (command === 'listn') {
    const banned = Object.entries(dbUsers).filter(([_, d]) => d.banned)
    if (!banned.length) return conn.sendMessage(m.chat, { text: `${done} Lista negra vacía.` })

    let msg = '🚫 *Lista negra global:*\n\n'
    const mentions = []

    banned.forEach(([jid, d], i) => {
      msg += `*${i + 1}.* @${jid.split('@')[0]}\n📝 Motivo: ${d.banReason}\n\n`
      mentions.push(jid)
    })

    await conn.sendMessage(m.chat, { text: msg.trim(), mentions })
  }

  // ==========================================
  // 🧹 LIMPIAR TODO
  // ==========================================
  else if (command === 'clrn') {
    for (const jid in dbUsers) {
      dbUsers[jid].banned = false
      dbUsers[jid].banReason = ''
      dbUsers[jid].bannedBy = null
    }
    await conn.sendMessage(m.chat, { text: `${done} Lista negra vaciada.` })
  }

  if (global.db.write) await global.db.write()
}

// ==========================================
// 🚨 AUTO-KICK SI HABLA
// ==========================================
handler.all = async function (m) {
  if (!m.isGroup || !m.sender) return
  const sender = normalizeJid(m.sender)
  const db = global.db.data.users

  if (db[sender]?.banned) {
    const reason = db[sender].banReason || 'No especificado'
    await this.groupParticipantsUpdate(m.chat, [sender], 'remove')
    await sleep(300)
    await this.sendMessage(m.chat, {
      text: `🚫 @${sender.split('@')[0]} fue eliminado por hablar.\n📝 Motivo: ${reason}`,
      mentions: [sender]
    })
  }
}

// ==========================================
// 🚨 AUTO-KICK SI ENTRA (SIEMPRE)
// ==========================================
handler.before = async function (m) {
  if (![27, 31].includes(m.messageStubType)) return
  const db = global.db.data.users

  for (const user of m.messageStubParameters || []) {
    const jid = normalizeJid(user)
    if (!db[jid]?.banned) continue
    const reason = db[jid].banReason || 'No especificado'
    await sleep(500)
    await this.groupParticipantsUpdate(m.chat, [jid], 'remove')
    await sleep(300)
    await this.sendMessage(m.chat, {
      text: `🚫 @${jid.split('@')[0]} fue eliminado al unirse.\n📝 Motivo: ${reason}`,
      mentions: [jid]
    })
  }
}

handler.help = ['addn', 'remn', 'clrn', 'listn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'clrn', 'listn']
handler.rowner = true

export default handler
