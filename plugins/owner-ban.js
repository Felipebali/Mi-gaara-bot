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

// 👉 CITAR = MENCIONAR = TEXTO
function resolveTargetJid(m, text = '') {
  if (m.quoted)
    return normalizeJid(m.quoted.sender || m.quoted.participant)

  if (m.mentionedJid?.length)
    return normalizeJid(m.mentionedJid[0])

  const num = extractPhoneNumber(text)
  if (num) return normalizeJid(num)

  return null
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
    const entry = Object.entries(dbUsers)
      .find(([jid, d]) => d.banned && digitsOnly(jid) === digitsOnly(quotedJid))

    if (entry) {
      try {
        const [realJid, data] = entry
        const reason = data.banReason || 'No especificado'
        const meta = await conn.groupMetadata(m.chat)
        const participant = findParticipantByDigits(meta, digitsOnly(realJid))
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

  // índice solo para remn
  if (command === 'remn' && /^\d+$/.test(text?.trim())) {
    const index = parseInt(text.trim()) - 1
    if (!bannedList[index])
      return conn.reply(m.chat, `${emoji} Número inválido.`, m)
    userJid = bannedList[index][0]
  } else {
    userJid = resolveTargetJid(m, text)
  }

  let reason = text?.replace(/@/g, '').replace(/\d{5,}/g, '').trim()
  if (!reason) reason = 'No especificado'

  if (!userJid && !['listn', 'clrn'].includes(command))
    return conn.reply(m.chat, `${warn} Debes responder, mencionar o usar índice.`, m)

  if (userJid && !dbUsers[userJid]) dbUsers[userJid] = {}

  // ================= ADD =================
  if (command === 'addn') {
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

    // ===== EXPULSIÓN GLOBAL =====
    try {
      const groups = Object.keys(await conn.groupFetchAllParticipating())
      for (const jid of groups) {
        await sleep(800)
        try {
          const meta = await conn.groupMetadata(jid)
          const participant = findParticipantByDigits(meta, digitsOnly(userJid))
          if (!participant) continue

          await conn.groupParticipantsUpdate(jid, [participant.id], 'remove')
          await sleep(700)

          await conn.sendMessage(jid, {
            text:
`🚫 *Usuario eliminado por LISTA NEGRA*
━━━━━━━━━━━━━━━━━━━━
👤 @${participant.id.split('@')[0]}
📝 Motivo: ${reason}
━━━━━━━━━━━━━━━━━━━━`,
            mentions: [participant.id]
          })
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
// ================= AUTO-KICK SI HABLA =================
// =====================================================

handler.all = async function (m) {
  try {
    if (!m.isGroup) return
    const sender = normalizeJid(m.sender)

    const entry = Object.entries(global.db.data.users)
      .find(([jid, d]) => d.banned && digitsOnly(jid) === digitsOnly(sender))
    if (!entry) return

    const [realJid] = entry
    const meta = await this.groupMetadata(m.chat)
    const participant = findParticipantByDigits(meta, digitsOnly(realJid))
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
// ========== AUTO-KICK + AVISO AL ENTRAR =================
// =====================================================

handler.before = async function (m) {
  try {
    if (![27, 31].includes(m.messageStubType)) return
    if (!m.isGroup) return

    const meta = await this.groupMetadata(m.chat)

    for (const u of m.messageStubParameters || []) {
      const ujid = normalizeJid(u)
      const digits = digitsOnly(ujid)

      const entry = Object.entries(global.db.data.users)
        .find(([jid, d]) => d.banned && digitsOnly(jid) === digits)

      if (!entry) continue

      const [realJid, data] = entry
      const participant = findParticipantByDigits(meta, digits)
      if (!participant) continue

      const reason = data.banReason || 'No especificado'

      await this.groupParticipantsUpdate(m.chat, [participant.id], 'remove')
      await sleep(700)

      await this.sendMessage(m.chat, {
        text:
`🚨 *USUARIO EN LISTA NEGRA*
━━━━━━━━━━━━━━━━━━━━
👤 @${participant.id.split('@')[0]}
📝 Motivo: ${reason}
🚫 Expulsión automática
━━━━━━━━━━━━━━━━━━━━`,
        mentions: [participant.id]
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
