// 📂 plugins/propietario-listanegra.js — FELI 2025 — FIX DEFINITIVO 🔥

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ================= UTILIDADES =================

function normalizeJid(jid = '') {
  if (!jid) return null
  jid = jid.toString().trim().replace(/^\+/, '')
  if (jid.endsWith('@c.us')) return jid.replace('@c.us', '@s.whatsapp.net')
  if (jid.endsWith('@s.whatsapp.net')) return jid
  if (jid.includes('@')) return jid
  const cleaned = jid.replace(/[^0-9]/g, '')
  if (!cleaned) return null
  return cleaned + '@s.whatsapp.net'
}

function digitsOnly(text = '') {
  return text.toString().replace(/[^0-9]/g, '')
}

function extractPhoneNumber(text = '') {
  const d = digitsOnly(text)
  if (!d || d.length < 5) return null
  return d
}

function findParticipantByDigits(metadata, digits) {
  return metadata.participants.find(p => {
    const pd = digitsOnly(p.id)
    return pd === digits || pd.endsWith(digits)
  })
}

// =====================================================
// ================= HANDLER PRINCIPAL =================
// =====================================================

const handler = async (m, { conn, command, text }) => {
  const emoji = '🚫'
  const warn = '⚠️'

  const dbUsers = global.db.data.users || (global.db.data.users = {})

  // ================= AUTO-KICK AL CITAR (SILENCIOSO) =================
  if (m.isGroup && m.quoted) {
    const quotedJid = normalizeJid(m.quoted.sender || m.quoted.participant)
    if (quotedJid && dbUsers[quotedJid]?.banned) {
      try {
        const meta = await conn.groupMetadata(m.chat)
        const participant = findParticipantByDigits(meta, digitsOnly(quotedJid))
        if (participant) {
          await conn.groupParticipantsUpdate(m.chat, [participant.id], 'remove')
        }
      } catch {}
    }
  }

  // ================= REACCIONES =================
  const reactions = { addn: '✅', remn: '☢️', clrn: '🧹', listn: '📜' }
  if (reactions[command])
    await conn.sendMessage(m.chat, { react: { text: reactions[command], key: m.key } })

  const bannedList = Object.entries(dbUsers).filter(([_, d]) => d.banned)

  let userJid = null
  let numberDigits = null

  if (command === 'remn' && /^\d+$/.test(text?.trim())) {
    const index = parseInt(text.trim()) - 1
    if (!bannedList[index])
      return conn.reply(m.chat, `${emoji} Número inválido.`, m)
    userJid = bannedList[index][0]
  } else if (m.quoted) {
    userJid = normalizeJid(m.quoted.sender || m.quoted.participant)
  } else if (m.mentionedJid?.length) {
    userJid = normalizeJid(m.mentionedJid[0])
  } else if (text) {
    const num = extractPhoneNumber(text)
    if (num) {
      numberDigits = num
      userJid = normalizeJid(num)
    }
  }

  let reason = text?.replace(/@/g, '').replace(/\d{5,}/g, '').trim()
  if (!reason) reason = 'No especificado'

  if (!userJid && !['listn', 'clrn'].includes(command))
    return conn.reply(m.chat, `${warn} Debes responder, mencionar o usar índice.`, m)

  if (userJid && !dbUsers[userJid]) dbUsers[userJid] = {}

  // ================= ADD (SILENCIOSO TOTAL) =================
  if (command === 'addn') {
    if (numberDigits && !m.quoted && !m.mentionedJid)
      return conn.reply(m.chat, `${emoji} Usa mencionar o citar, no escribas números.`, m)

    dbUsers[userJid].banned = true
    dbUsers[userJid].banReason = reason
    dbUsers[userJid].bannedBy = m.sender

    // ===== EXPULSIÓN GLOBAL SILENCIOSA (FIX BAILEYS) =====
    try {
      const groups = await conn.groupFetchAllParticipating()
      for (const jid in groups) {
        try {
          const meta = groups[jid]
          if (!meta?.participants) continue

          const participant = findParticipantByDigits(meta, digitsOnly(userJid))
          if (!participant) continue

          await conn.groupParticipantsUpdate(jid, [participant.id], 'remove')
          await sleep(500)
        } catch {}
      }
    } catch {}
  }

  // ================= REMOVER =================
  else if (command === 'remn') {
    if (!dbUsers[userJid]?.banned)
      return conn.reply(m.chat, `${emoji} No está en la lista negra.`, m)

    dbUsers[userJid] = { banned: false }
  }

  // ================= LISTAR =================
  else if (command === 'listn') {
    if (!bannedList.length)
      return conn.reply(m.chat, `✅ Lista negra vacía.`, m)

    let msg = `🚫 *Lista Negra — ${bannedList.length}*\n`
    const mentions = []

    bannedList.forEach(([jid, d], i) => {
      msg += `\n*${i + 1}.* @${jid.split('@')[0]}`
      mentions.push(jid)
    })

    await conn.sendMessage(m.chat, { text: msg.trim(), mentions })
  }

  // ================= LIMPIAR =================
  else if (command === 'clrn') {
    for (const jid in dbUsers) dbUsers[jid].banned = false
  }

  if (global.db.write) await global.db.write()
}

// =====================================================
// ================= AUTO-KICK SI HABLA (SILENCIOSO) =================
// =====================================================

handler.all = async function (m) {
  try {
    if (!m.isGroup) return
    const sender = normalizeJid(m.sender)
    if (!global.db.data.users[sender]?.banned) return

    const meta = await this.groupMetadata(m.chat)
    const participant = findParticipantByDigits(meta, digitsOnly(sender))
    if (!participant) return

    await this.groupParticipantsUpdate(m.chat, [participant.id], 'remove')
  } catch {}
}

// =====================================================
// ========== AUTO-KICK AL ENTRAR (SILENCIOSO) =================
// =====================================================

handler.before = async function (m) {
  try {
    if (![27, 31].includes(m.messageStubType)) return
    if (!m.isGroup) return

    const meta = await this.groupMetadata(m.chat)

    for (const u of m.messageStubParameters || []) {
      const ujid = normalizeJid(u)
      const data = global.db.data.users[ujid]
      if (!data?.banned) continue

      const participant = findParticipantByDigits(meta, digitsOnly(ujid))
      if (!participant) continue

      await this.groupParticipantsUpdate(m.chat, [participant.id], 'remove')
    }
  } catch {}
}

// ================= CONFIG =================

handler.help = ['addn', 'remn', 'listn', 'clrn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'listn', 'clrn']
handler.rowner = true

export default handler
