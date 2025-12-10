// 📂 plugins/propietario-listanegra.js — ULTRA FINAL CON AUTO-KICK GLOBAL ⚡
// Expulsión inmediata por: número, mención, cita, hablar y al entrar

// ================= UTILIDADES =================
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function normalizeJid(jid = '') {
  if (!jid) return null
  jid = jid.toString().trim().replace(/^\+/, '')
  if (jid.endsWith('@c.us') || jid.endsWith('@s.whatsapp.net'))
    return jid.replace(/@c.us$/, '@s.whatsapp.net')
  if (jid.includes('@')) return jid
  return jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
}

function digitsOnly(text = '') {
  return (text || '').toString().replace(/[^0-9]/g, '')
}

function extractPhoneNumber(text = '') {
  const d = digitsOnly(text)
  if (!d || d.length < 5) return null
  return d
}

function findMemberByNumber(group, numberDigits) {
  if (!group || !group.participants) return null
  for (const p of group.participants) {
    const pid = (p.id || p).toString()
    const pd = digitsOnly(pid)
    if (!pd) continue
    if (pd === numberDigits || pd.endsWith(numberDigits) || numberDigits.endsWith(pd))
      return p.id || p
    if (pd.includes(numberDigits) || numberDigits.includes(pd))
      return p.id || p
  }
  return null
}

async function kickUser(conn, chatId, userJid, reason = 'No especificado') {
  try {
    await conn.groupParticipantsUpdate(chatId, [userJid], 'remove')
    await sleep(500)
    await conn.sendMessage(chatId, {
      text: `🚫 @${userJid.split('@')[0]} fue eliminado automáticamente por estar en lista negra.\n📝 Motivo: ${reason}`,
      mentions: [userJid]
    })
  } catch {}
}

// ================= HANDLER PRINCIPAL =================
const handler = async (m, { conn, command, text }) => {
  const emoji = '🚫'
  const done = '✅'
  const dbUsers = global.db.data.users || (global.db.data.users = {})

  // ================= AUTO-KICK INMEDIATO POR CITA =================
  if (m.isGroup && m.quoted) {
    const quotedJid = normalizeJid(m.quoted.sender || m.quoted.participant)
    if (dbUsers[quotedJid]?.banned) {
      await kickUser(conn, m.chat, quotedJid, dbUsers[quotedJid].banReason)
      return
    }
  }

  // Reacciones
  const reactions = { addn: '✅', remn: '☢️', clrn: '🧹', listn: '📜' }
  if (reactions[command])
    await conn.sendMessage(m.chat, { react: { text: reactions[command], key: m.key } })

  const bannedList = Object.entries(dbUsers).filter(([_, data]) => data.banned)

  let userJid = null
  let numberDigits = null

  // ================= REMN 1 / REMN 2 / REMN 3 =================
  if (command === 'remn' && /^\d+$/.test(text?.trim())) {
    const index = parseInt(text.trim()) - 1
    if (!bannedList[index])
      return conn.reply(m.chat, `${emoji} Número inválido en la lista.`, m)
    userJid = bannedList[index][0]
  }
  else if (m.quoted)
    userJid = normalizeJid(m.quoted.sender || m.quoted.participant)
  else if (m.mentionedJid?.length)
    userJid = normalizeJid(m.mentionedJid[0])
  else if (text) {
    const num = extractPhoneNumber(text)
    if (num) {
      numberDigits = num
      userJid = normalizeJid(num)
    }
  }

  let reason = text?.replace(/@/g, '').replace(/\d{5,}/g, '').trim()
  if (!reason) reason = 'No especificado'

  if (!userJid && !['listn', 'clrn'].includes(command))
    return conn.reply(m.chat, `${emoji} Debes responder, mencionar, escribir número o usar número de lista.`, m)

  if (userJid && !dbUsers[userJid]) dbUsers[userJid] = {}

  // ================= ADDN — AGREGAR A LISTA NEGRA =================
  if (command === 'addn') {
    dbUsers[userJid].banned = true
    dbUsers[userJid].banReason = reason
    dbUsers[userJid].bannedBy = m.sender

    await conn.sendMessage(m.chat, {
      text: `${done} @${userJid.split('@')[0]} agregado a lista negra.\n📝 Motivo: ${reason}`,
      mentions: [userJid]
    })

    // 🔥 EXPULSIÓN INMEDIATA SI ES EN GRUPO O SI SE UNE DESPUÉS
    const groupsObj = await conn.groupFetchAllParticipating()
    const groups = Object.keys(groupsObj)

    for (const jid of groups) {
      await sleep(500)
      try {
        const group = await conn.groupMetadata(jid)
        let member = group.participants.find(p => normalizeJid(p.id) === userJid)
        if (!member && numberDigits)
          member = findMemberByNumber(group, numberDigits)
        if (!member) continue
        const memberId = member.id || member
        await kickUser(conn, jid, memberId, reason)
      } catch {}
    }
  }

  // ================= REMOVER DE LISTA NEGRA =================
  else if (command === 'remn') {
    if (!dbUsers[userJid]?.banned)
      return conn.sendMessage(m.chat, { text: `${emoji} No está en lista negra.` })

    dbUsers[userJid].banned = false
    dbUsers[userJid].banReason = ''
    dbUsers[userJid].bannedBy = null

    await conn.sendMessage(m.chat, {
      text: `${done} @${userJid.split('@')[0]} eliminado de la lista negra.`,
      mentions: [userJid]
    })
  }

  // ================= LISTA COMPLETA =================
  else if (command === 'listn') {
    if (bannedList.length === 0)
      return conn.sendMessage(m.chat, { text: `${done} Lista negra vacía.` })

    let list = '🚫 *Lista negra:*\n\n'
    const mentions = []
    bannedList.forEach(([jid, data], i) => {
      list += `${i + 1}. @${jid.split('@')[0]}\nMotivo: ${data.banReason}\n\n`
      mentions.push(jid)
    })
    await conn.sendMessage(m.chat, { text: list.trim(), mentions })
  }

  // ================= LIMPIAR LISTA =================
  else if (command === 'clrn') {
    for (const jid in dbUsers) {
      if (dbUsers[jid]?.banned) {
        dbUsers[jid].banned = false
        dbUsers[jid].banReason = ''
        dbUsers[jid].bannedBy = null
      }
    }
    await conn.sendMessage(m.chat, { text: `${done} Lista negra vaciada.` })
  }

  if (global.db.write) await global.db.write()
}

// ================= AUTO-KICK SI HABLA =================
handler.all = async function (m) {
  try {
    if (!m.isGroup || !m.sender) return
    const db = global.db.data.users
    const sender = normalizeJid(m.sender)
    if (db[sender]?.banned)
      await kickUser(this, m.chat, sender, db[sender].banReason)
  } catch {}
}

// ================= AUTO-KICK AL ENTRAR =================
handler.before = async function (m) {
  try {
    const db = global.db.data.users
    const conn = this

    const possibleSources = [
      m.messageStubParameters,
      m.participants,
      (m.update && m.update.participants) || null,
      (m.message && m.message.participant) ? [m.message.participant] : null
    ].filter(Boolean)

    const candidates = new Set()
    for (const src of possibleSources) {
      if (Array.isArray(src)) src.forEach(it => it && candidates.add(normalizeJid(it)))
      else candidates.add(normalizeJid(src))
    }

    if (candidates.size === 0) return

    for (const u of Array.from(candidates)) {
      if (!u) continue
      if (db[u]?.banned)
        await kickUser(conn, m.chat, u, db[u].banReason)
    }
  } catch (e) {
    console.error('Error en auto-kick al entrar:', e)
  }
}

// ================= CONFIG FINAL =================
handler.help = ['addn', 'remn', 'clrn', 'listn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'clrn', 'listn']
handler.rowner = true

export default handler
