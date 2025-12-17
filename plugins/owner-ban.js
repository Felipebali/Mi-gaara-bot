// 📂 plugins/propietario-listanegra.js — FELI 2025 — FIX DEFINITIVO +598 🔥☢️

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ================= UTILIDADES =================

function normalizeJid(jid = '') {
  if (!jid) return null
  jid = jid.toString().trim().replace(/^\+/, '')
  if (jid.endsWith('@c.us')) return jid.replace('@c.us', '@s.whatsapp.net')
  if (jid.endsWith('@s.whatsapp.net') || jid.endsWith('@lid')) return jid
  if (jid.includes('@')) return jid
  const cleaned = jid.replace(/[^0-9]/g, '')
  if (!cleaned) return null
  return cleaned + '@s.whatsapp.net'
}

function digitsOnly(text = '') {
  return text.toString().replace(/[^0-9]/g, '')
}

function extractPhoneNumber(text = '') {
  const match = text.match(/\+\d[\d\s]*/g)
  if (!match) return null
  return match[0].replace(/\D/g, '')
}

// 🔥 BUSCA BANEADO POR NÚMERO (GLOBAL)
function findBannedByDigits(digits) {
  const users = global.db.data.users || {}
  return Object.entries(users).find(([jid, data]) => {
    if (!data?.banned) return false
    const jd = digitsOnly(jid)
    return jd === digits || jd.endsWith(digits)
  })
}

// =====================================================
// ================= HANDLER PRINCIPAL =================
// =====================================================

const handler = async (m, { conn, command, text }) => {
  const SEP = '━━━━━━━━━━━━━━━━━━━━'
  const emoji = '🚫'
  const ok = '✅'
  const warn = '⚠️'

  const dbUsers = global.db.data.users || (global.db.data.users = {})

  const reactions = { addn: '✅', remn: '☢️', clrn: '🧹', listn: '📜' }
  if (reactions[command])
    await conn.sendMessage(m.chat, { react: { text: reactions[command], key: m.key } })

  const bannedList = Object.entries(dbUsers).filter(([_, d]) => d.banned)

  let userJid = null

  // ===== detectar usuario =====
  if (command === 'remn' && /^\d+$/.test(text?.trim())) {
    const index = parseInt(text.trim()) - 1
    if (!bannedList[index])
      return conn.reply(m.chat, `${emoji} Índice inválido.`, m)
    userJid = bannedList[index][0]
  }
  else if (m.quoted) {
    userJid = normalizeJid(m.quoted.sender || m.quoted.participant)
  }
  else if (m.mentionedJid?.length) {
    userJid = normalizeJid(m.mentionedJid[0])
  }
  else if (text) {
    const num = extractPhoneNumber(text)
    if (num) userJid = num + '@s.whatsapp.net'
  }

  let reason = text
    ?.replace(/@\d+/g, '')
    ?.replace(/\+\d[\d\s]*/g, '')
    ?.trim()

  if (!reason) reason = 'No especificado'

  if (!userJid && !['listn', 'clrn'].includes(command))
    return conn.reply(m.chat, `${warn} Debes mencionar, responder o usar +598.`, m)

  if (userJid && !dbUsers[userJid]) dbUsers[userJid] = {}

  // ================= ADD =================
  if (command === 'addn') {
    dbUsers[userJid].banned = true
    dbUsers[userJid].banReason = reason
    dbUsers[userJid].bannedBy = m.sender

    const digits = digitsOnly(userJid)
    const jidWA = digits + '@s.whatsapp.net'
    const jidLID = digits + '@lid'

    await conn.sendMessage(m.chat, {
      text: `${ok} *Agregado a LISTA NEGRA*\n${SEP}\n@${digits}\n📝 Motivo: ${reason}\n${SEP}`,
      mentions: [jidWA]
    })

    try {
      const groups = Object.keys(await conn.groupFetchAllParticipating())
      for (const gid of groups) {
        await sleep(700)
        try { await conn.groupParticipantsUpdate(gid, [jidWA], 'remove') } catch {}
        try { await conn.groupParticipantsUpdate(gid, [jidLID], 'remove') } catch {}
      }
    } catch {}
  }

  // ================= REMOVER =================
  else if (command === 'remn') {
    if (!dbUsers[userJid]?.banned)
      return conn.reply(m.chat, `${emoji} No está en lista negra.`, m)

    dbUsers[userJid] = { banned: false }

    await conn.sendMessage(m.chat, {
      text: `${ok} *Removido de lista negra*\n${SEP}\n@${digitsOnly(userJid)}`,
      mentions: [digitsOnly(userJid) + '@s.whatsapp.net']
    })
  }

  // ================= LISTAR =================
  else if (command === 'listn') {
    if (!bannedList.length)
      return conn.reply(m.chat, `${ok} Lista negra vacía.`, m)

    let msg = `🚫 *Lista Negra — ${bannedList.length}*\n${SEP}\n`
    const mentions = []

    bannedList.forEach(([jid, d], i) => {
      const digits = digitsOnly(jid)
      msg += `*${i + 1}.* @${digits}\n📝 ${d.banReason}\n\n`
      mentions.push(digits + '@s.whatsapp.net')
    })

    msg += SEP
    await conn.sendMessage(m.chat, { text: msg.trim(), mentions })
  }

  // ================= LIMPIAR =================
  else if (command === 'clrn') {
    for (const jid in dbUsers) dbUsers[jid].banned = false
    await conn.sendMessage(m.chat, { text: `${ok} Lista negra vaciada.` })
  }

  if (global.db.write) await global.db.write()
}

// =====================================================
// ================= AUTO-KICK SI HABLA =================
// =====================================================

handler.all = async function (m) {
  try {
    if (!m.isGroup) return
    const digits = digitsOnly(m.sender)
    const found = findBannedByDigits(digits)
    if (!found) return

    const jidWA = digits + '@s.whatsapp.net'
    const jidLID = digits + '@lid'

    try { await this.groupParticipantsUpdate(m.chat, [jidWA], 'remove') } catch {}
    try { await this.groupParticipantsUpdate(m.chat, [jidLID], 'remove') } catch {}

    await sleep(500)

    await this.sendMessage(m.chat, {
      text: `🚫 *Eliminado por LISTA NEGRA*\n━━━━━━━━━━━━━━━━━━━━\n@${digits}`,
      mentions: [jidWA]
    })
  } catch {}
}

// =====================================================
// ========== AUTO-KICK + AVISO AL ENTRAR =================
// =====================================================

handler.before = async function (m) {
  try {
    if (![27, 31].includes(m.messageStubType)) return
    if (!m.isGroup) return

    for (const u of m.messageStubParameters || []) {
      const digits = digitsOnly(u)
      const found = findBannedByDigits(digits)
      if (!found) continue

      const [, data] = found
      const jidWA = digits + '@s.whatsapp.net'
      const jidLID = digits + '@lid'

      await this.sendMessage(m.chat, {
        text:
`🚨 *USUARIO EN LISTA NEGRA*
━━━━━━━━━━━━━━━━━━━━
👤 @${digits}
📝 Motivo: ${data.banReason || 'No especificado'}
🚫 Expulsión automática
━━━━━━━━━━━━━━━━━━━━`,
        mentions: [jidWA]
      })

      await sleep(600)
      try { await this.groupParticipantsUpdate(m.chat, [jidWA], 'remove') } catch {}
      try { await this.groupParticipantsUpdate(m.chat, [jidLID], 'remove') } catch {}
    }
  } catch {}
}

// ================= CONFIG =================

handler.help = ['addn', 'remn', 'listn', 'clrn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'listn', 'clrn']
handler.rowner = true

export default handler
