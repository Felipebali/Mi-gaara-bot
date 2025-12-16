// 📂 plugins/propietario-listanegra.js — FELI 2025 — FIX DEFINITIVO 🔥

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ================= UTILIDADES =================

function normalizeJid(jid = '') {
  if (!jid) return null
  jid = jid.toString().trim().replace(/^\+/, '')
  if (jid.endsWith('@c.us') || jid.endsWith('@s.whatsapp.net'))
    return jid.replace(/@c.us$/, '@s.whatsapp.net')
  if (jid.includes('@')) return jid
  const cleaned = jid.replace(/[^0-9]/g, '')
  if (!cleaned) return null
  return cleaned + '@s.whatsapp.net'
}

function digitsOnly(text = '') {
  return (text || '').toString().replace(/[^0-9]/g, '')
}

function extractPhoneNumber(text = '') {
  const d = digitsOnly(text)
  if (!d || d.length < 5) return null
  return d
}

// 🔥 FIX REAL — manejar IDs con :xx
function findParticipantByDigits(metadata, digits) {
  return metadata.participants.find(p => {
    const baseId = p.id.split(':')[0] // ← CLAVE
    const pd = digitsOnly(baseId)
    return pd === digits || pd.endsWith(digits)
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

  // ================= AUTO-KICK AL CITAR =================
  if (m.isGroup && m.quoted) {
    const quotedJid = normalizeJid(m.quoted.sender || m.quoted.participant)
    if (quotedJid && dbUsers[quotedJid]?.banned) {
      try {
        const reason = dbUsers[quotedJid].banReason || 'No especificado'
        const metadata = await conn.groupMetadata(m.chat)
        const participant = findParticipantByDigits(metadata, digitsOnly(quotedJid))

        if (participant) {
          await conn.groupParticipantsUpdate(m.chat, [participant.id], 'remove')
          await sleep(500)
          await conn.sendMessage(m.chat, {
            text: `${emoji} *Eliminación inmediata por LISTA NEGRA*\n${SEP}\n@${participant.id.split('@')[0]} eliminado.\n📝 Motivo: ${reason}\n${SEP}`,
            mentions: [participant.id]
          })
        }
      } catch {}
    }
  }

  const reactions = { addn: '✅', remn: '☢️', clrn: '🧹', listn: '📜' }
  if (reactions[command])
    await conn.sendMessage(m.chat, { react: { text: reactions[command], key: m.key } })

  const bannedList = Object.entries(dbUsers).filter(([_, d]) => d.banned)

  let userJid = null

  if (command === 'remn' && /^\d+$/.test(text?.trim())) {
    const index = parseInt(text.trim()) - 1
    if (!bannedList[index])
      return conn.reply(m.chat, `${emoji} Índice inválido.`, m)
    userJid = bannedList[index][0]

  } else if (m.quoted) {
    userJid = normalizeJid(m.quoted.sender || m.quoted.participant)

  } else if (m.mentionedJid?.length) {
    userJid = normalizeJid(m.mentionedJid[0])

  } else if (text) {
    const num = extractPhoneNumber(text)
    if (num) userJid = normalizeJid(num)
  }

  let reason = text?.replace(/@\S+/g, '').replace(/\d{5,}/g, '').trim()
  if (!reason) reason = 'No especificado'

  if (!userJid && !['listn', 'clrn'].includes(command))
    return conn.reply(m.chat, `${warn} Debes mencionar, citar o escribir el número.`, m)

  if (userJid && !dbUsers[userJid]) dbUsers[userJid] = {}

  // ================= ADD =================
  if (command === 'addn') {

    dbUsers[userJid].banned = true
    dbUsers[userJid].banReason = reason
    dbUsers[userJid].bannedBy = m.sender

    await conn.sendMessage(m.chat, {
      text: `${ok} *Agregado a LISTA NEGRA*\n${SEP}\n@${userJid.split('@')[0]}\n📝 Motivo: ${reason}\n${SEP}`,
      mentions: [userJid]
    })

    // === EXPULSIÓN LOCAL ===
    if (m.isGroup) {
      try {
        const metadata = await conn.groupMetadata(m.chat)
        const participant = findParticipantByDigits(metadata, digitsOnly(userJid))

        if (participant) {
          await conn.groupParticipantsUpdate(m.chat, [participant.id], 'remove')
          await sleep(500)
        }
      } catch {}
    }

    // === EXPULSIÓN GLOBAL ===
    try {
      const groups = Object.keys(await conn.groupFetchAllParticipating())
      for (const jid of groups) {
        await sleep(700)
        try {
          const meta = await conn.groupMetadata(jid)
          const participant = findParticipantByDigits(meta, digitsOnly(userJid))
          if (!participant) continue
          await conn.groupParticipantsUpdate(jid, [participant.id], 'remove')
        } catch {}
      }
    } catch {}
  }

  // ================= REMOVER =================
  else if (command === 'remn') {
    if (!dbUsers[userJid]?.banned)
      return conn.reply(m.chat, `${emoji} No está en la lista negra.`, m)

    dbUsers[userJid] = { banned: false }
    await conn.sendMessage(m.chat, {
      text: `${ok} *Removido de lista negra*\n@${userJid.split('@')[0]}`,
      mentions: [userJid]
    })
  }

  // ================= LISTAR =================
  else if (command === 'listn') {
    if (!bannedList.length)
      return conn.reply(m.chat, `${ok} Lista negra vacía.`, m)

    let msg = `🚫 *LISTA NEGRA (${bannedList.length})*\n${SEP}\n`
    const mentions = []

    bannedList.forEach(([jid, d], i) => {
      msg += `${i + 1}. @${jid.split('@')[0]}\n📝 ${d.banReason}\n\n`
      mentions.push(jid)
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
    const sender = normalizeJid(m.sender)
    if (!global.db.data.users[sender]?.banned) return

    const meta = await this.groupMetadata(m.chat)
    const participant = findParticipantByDigits(meta, digitsOnly(sender))
    if (!participant) return

    await this.groupParticipantsUpdate(m.chat, [participant.id], 'remove')
  } catch {}
}

// =====================================================
// ================= AUTO-KICK AL ENTRAR =================
// =====================================================

handler.before = async function (m) {
  try {
    if (![27, 31].includes(m.messageStubType)) return
    const meta = await this.groupMetadata(m.chat)

    for (const u of m.messageStubParameters || []) {
      const ujid = normalizeJid(u)
      if (!global.db.data.users[ujid]?.banned) continue

      const participant = findParticipantByDigits(meta, digitsOnly(ujid))
      if (participant)
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
