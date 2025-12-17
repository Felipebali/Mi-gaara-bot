// 📂 plugins/propietario-listanegra.js — FELI 2025 — FIX DEFINITIVO +598 🔥

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

function findParticipantByDigits(metadata, digits) {
  return metadata.participants.find(p => {
    const pd = digitsOnly(p.id)
    return pd === digits || pd.endsWith(digits)
  })
}

// 🔥 FIX CLAVE — BUSCA BANEADO POR NÚMERO
function findBannedByDigits(digits) {
  const users = global.db.data.users || {}
  return Object.entries(users).find(([jid, data]) => {
    if (!data?.banned) return false
    const jd = digitsOnly(jid)
    return jd === digits || jd.endsWith(digits)
  })
}

async function resolveJidFromNumber(conn, chat, number) {
  try {
    if (chat) {
      const meta = await conn.groupMetadata(chat)
      const p = findParticipantByDigits(meta, number)
      if (p) return p.id
    }
  } catch {}
  return number + '@s.whatsapp.net'
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
    const digits = digitsOnly(m.quoted.sender || m.quoted.participant)
    const found = findBannedByDigits(digits)
    if (found) {
      const [realJid, data] = found
      try {
        const meta = await conn.groupMetadata(m.chat)
        const p = findParticipantByDigits(meta, digits)
        if (p) {
          await conn.groupParticipantsUpdate(m.chat, [p.id], 'remove')
          await sleep(500)
          await conn.sendMessage(m.chat, {
            text: `${emoji} *Eliminación inmediata por LISTA NEGRA*\n${SEP}\n@${p.id.split('@')[0]}\n📝 Motivo: ${data.banReason || 'No especificado'}\n${SEP}`,
            mentions: [p.id]
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
  let numberDigits = null

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
    if (num) {
      numberDigits = num
      userJid = await resolveJidFromNumber(conn, m.isGroup ? m.chat : null, num)
    }
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

    await conn.sendMessage(m.chat, {
      text: `${ok} *Agregado a LISTA NEGRA*\n${SEP}\n@${userJid.split('@')[0]}\n📝 Motivo: ${reason}\n${SEP}`,
      mentions: [userJid]
    })

    if (m.isGroup) {
      try { await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove') } catch {}
    }

    try {
      const groups = Object.keys(await conn.groupFetchAllParticipating())
      for (const gid of groups) {
        await sleep(700)
        try {
          const meta = await conn.groupMetadata(gid)
          const p = findParticipantByDigits(meta, digitsOnly(userJid))
          if (p) await conn.groupParticipantsUpdate(gid, [p.id], 'remove')
        } catch {}
      }
    } catch {}
  }

  // ================= REMOVER =================
  else if (command === 'remn') {
    if (!dbUsers[userJid]?.banned)
      return conn.reply(m.chat, `${emoji} No está en lista negra.`, m)

    dbUsers[userJid] = { banned: false }

    await conn.sendMessage(m.chat, {
      text: `${ok} *Removido de lista negra*\n${SEP}\n@${userJid.split('@')[0]}`,
      mentions: [userJid]
    })
  }

  // ================= LISTAR =================
  else if (command === 'listn') {
    if (!bannedList.length)
      return conn.reply(m.chat, `${ok} Lista negra vacía.`, m)

    let msg = `🚫 *Lista Negra — ${bannedList.length}*\n${SEP}\n`
    const mentions = []

    bannedList.forEach(([jid, d], i) => {
      msg += `*${i + 1}.* @${jid.split('@')[0]}\n📝 ${d.banReason}\n\n`
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
    const digits = digitsOnly(m.sender)
    const found = findBannedByDigits(digits)
    if (!found) return

    const meta = await this.groupMetadata(m.chat)
    const p = findParticipantByDigits(meta, digits)
    if (!p) return

    await this.groupParticipantsUpdate(m.chat, [p.id], 'remove')
    await sleep(500)

    await this.sendMessage(m.chat, {
      text: `🚫 *Eliminado por LISTA NEGRA*\n━━━━━━━━━━━━━━━━━━━━\n@${p.id.split('@')[0]}`,
      mentions: [p.id]
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

    const meta = await this.groupMetadata(m.chat)

    for (const u of m.messageStubParameters || []) {
      const digits = digitsOnly(u)
      const found = findBannedByDigits(digits)
      if (!found) continue

      const [, data] = found
      const p = findParticipantByDigits(meta, digits)
      if (!p) continue

      await this.sendMessage(m.chat, {
        text:
`🚨 *USUARIO EN LISTA NEGRA*
━━━━━━━━━━━━━━━━━━━━
👤 @${p.id.split('@')[0]}
📝 Motivo: ${data.banReason || 'No especificado'}
🚫 Expulsión automática
━━━━━━━━━━━━━━━━━━━━`,
        mentions: [p.id]
      })

      await sleep(600)
      await this.groupParticipantsUpdate(m.chat, [p.id], 'remove')
    }
  } catch {}
}

// ================= CONFIG =================

handler.help = ['addn', 'remn', 'listn', 'clrn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'listn', 'clrn']
handler.rowner = true

export default handler
