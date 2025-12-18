function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

const cleanedGroups = new Set()

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
        const meta = await conn.groupMetadata(m.chat)
        const participant = findParticipantByDigits(meta, digitsOnly(quotedJid))
        if (participant) {
          await conn.groupParticipantsUpdate(m.chat, [participant.id], 'remove')
          await sleep(700)

          await conn.sendMessage(m.chat, {
            text:
`${emoji} *Eliminación inmediata por LISTA NEGRA*
${SEP}
@${participant.id.split('@')[0]}
📝 Motivo: ${reason}
${SEP}`,
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

  // ================= ADD =================
  if (command === 'addn') {
    if (numberDigits && !m.quoted && !m.mentionedJid)
      return conn.reply(m.chat, `${emoji} Usa mencionar o citar, no escribas números.`, m)

    dbUsers[userJid].banned = true
    dbUsers[userJid].banReason = reason
    dbUsers[userJid].bannedBy = m.sender

    await conn.sendMessage(m.chat, {
      text:
`${ok} *Agregado a LISTA NEGRA*
${SEP}
@${userJid.split('@')[0]}
📝 Motivo: ${reason}
${SEP}`,
      mentions: [userJid]
    })
  }

  // ================= REMOVER =================
  else if (command === 'remn') {
    if (!dbUsers[userJid]?.banned)
      return conn.reply(m.chat, `${emoji} No está en la lista negra.`, m)

    dbUsers[userJid] = { banned: false }

    await conn.sendMessage(m.chat, {
      text:
`${ok} *Removido de lista negra*
${SEP}
@${userJid.split('@')[0]}`,
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
// ================= AUTO-KICK SI HABLA (FIX REAL) ======
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
    await sleep(700)

    await this.sendMessage(m.chat, {
      text:
`🚫 *Eliminado por LISTA NEGRA*
━━━━━━━━━━━━━━━━━━━━
@${participant.id.split('@')[0]}`,
      mentions: [participant.id]
    })
  } catch {}
}

// =====================================================
// ========== LIMPIEZA AL ENTRAR EL BOT =================
// =====================================================

handler.before = async function (m) {
  try {
    if (!m.isGroup) return

    const meta = await this.groupMetadata(m.chat)
    const botJid = this.user?.jid
    const bot = meta.participants.find(p => p.id === botJid)
    if (!bot?.admin) return

    if (cleanedGroups.has(m.chat)) return
    cleanedGroups.add(m.chat)

    for (const p of meta.participants) {
      const jid = normalizeJid(p.id)
      const data = global.db.data.users[jid]
      if (!data?.banned) continue

      const reason = data.banReason || 'No especificado'

      await this.groupParticipantsUpdate(m.chat, [p.id], 'remove')
      await sleep(800)

      await this.sendMessage(m.chat, {
        text:
`🚨 *LIMPIEZA AUTOMÁTICA — LISTA NEGRA*
━━━━━━━━━━━━━━━━━━━━
👤 @${p.id.split('@')[0]}
📝 Motivo: ${reason}
━━━━━━━━━━━━━━━━━━━━`,
        mentions: [p.id]
      })
    }
  } catch {}
}

// ================= CONFIG =================

handler.help = ['addn', 'remn', 'listn', 'clrn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'listn', 'clrn']
handler.rowner = true

export default handler
