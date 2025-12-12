// 📂 plugins/propietario-listanegra.js — VERSIÓN ULTRA FELI 2025
// Permite agregar con número, mención o cita; expulsión inmediata si está en el grupo

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

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

// =====================================================
// ================= HANDLER PRINCIPAL =================
// =====================================================

const handler = async (m, { conn, command, text }) => {
  const SEP = '━━━━━━━━━━━━━━━━━━━━'
  const emoji = '🚫'
  const ok = '✅'
  const warn = '⚠️'

  const dbUsers = global.db.data.users || (global.db.data.users = {})
  const bannedList = Object.entries(dbUsers).filter(([_, data]) => data.banned)

  let userJid = null
  let numberDigits = null

  // remn por índice
  if (command === 'remn' && /^\d+$/.test(text?.trim())) {
    const index = parseInt(text.trim()) - 1
    if (!bannedList[index])
      return conn.reply(m.chat, `${emoji} Número inválido.`, m)
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

  let reason = text?.replace(/@/g, '').replace(/\d{5,}/g, '').trim() || 'No especificado'
  if (!userJid && !['listn', 'clrn'].includes(command))
    return conn.reply(m.chat, `${warn} Debes responder, mencionar o usar índice.`, m)

  if (userJid && !dbUsers[userJid]) dbUsers[userJid] = {}

  // =====================================================
  // ======================= ADD =========================
  // =====================================================
  if (command === 'addn') {
    dbUsers[userJid].banned = true
    dbUsers[userJid].banReason = reason
    dbUsers[userJid].bannedBy = m.sender

    await conn.sendMessage(m.chat, {
      text: `${ok} *Agregado a LISTA NEGRA*\n${SEP}\n@${userJid.split('@')[0]} agregado.\n📝 Motivo: ${reason}\n${SEP}`,
      mentions: [userJid]
    })

    // EXPULSIÓN INMEDIATA EN EL GRUPO
    if (m.isGroup) {
      try {
        const metadata = await conn.groupMetadata(m.chat)
        const inGroup = metadata.participants.some(p => normalizeJid(p.id) === userJid)

        if (inGroup) {
          await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove')
          await sleep(500)
          await conn.sendMessage(m.chat, {
            text: `${emoji} *Expulsión inmediata*\n${SEP}\n@${userJid.split('@')[0]} eliminado.\n📝 Motivo: ${reason}\n${SEP}`,
            mentions: [userJid]
          })
        }
      } catch {}
    }

    // EXPULSIÓN GLOBAL
    try {
      const groupsObj = await conn.groupFetchAllParticipating()
      for (const jid of Object.keys(groupsObj)) {
        try {
          const group = await conn.groupMetadata(jid)
          const member = group.participants.find(p => normalizeJid(p.id) === userJid)
          if (!member) continue

          await conn.groupParticipantsUpdate(jid, [member.id], 'remove')
          await sleep(500)

          await conn.sendMessage(jid, {
            text: `${emoji} @${member.id.split('@')[0]} eliminado por lista negra.\n📝 Motivo: ${reason}`,
            mentions: [member.id]
          })
        } catch {}
      }
    } catch {}
  }

  // =====================================================
  // ======================= REMOVER =====================
  // =====================================================
  else if (command === 'remn') {
    if (!userJid || !dbUsers[userJid]?.banned)
      return conn.reply(m.chat, `${emoji} No está en la lista negra.`, m)

    dbUsers[userJid].banned = false
    dbUsers[userJid].banReason = ''
    dbUsers[userJid].bannedBy = null

    await conn.sendMessage(m.chat, {
      text: `${ok} *Removido de lista negra*\n${SEP}\n@${userJid.split('@')[0]} removido.`,
      mentions: [userJid]
    })
  }

  // =====================================================
  // ======================= LISTAR ======================
  // =====================================================
  else if (command === 'listn') {
    if (bannedList.length === 0) return conn.reply(m.chat, `${ok} Lista negra vacía.`, m)

    let list = `🚫 *Lista Negra — ${bannedList.length}*\n${SEP}\n`
    const mentions = []

    bannedList.forEach(([jid, data], i) => {
      list += `*${i + 1}.* @${jid.split('@')[0]}\n📝 ${data.banReason || 'No especificado'}\n\n`
      mentions.push(jid)
    })

    list += SEP
    await conn.sendMessage(m.chat, { text: list.trim(), mentions })
  }

  // =====================================================
  // ======================= LIMPIAR =====================
  // =====================================================
  else if (command === 'clrn') {
    for (const jid in dbUsers) {
      if (dbUsers[jid]?.banned) {
        dbUsers[jid].banned = false
        dbUsers[jid].banReason = ''
        dbUsers[jid].bannedBy = null
      }
    }
    await conn.sendMessage(m.chat, { text: `${ok} Lista negra vaciada.` })
  }

  if (global.db.write) await global.db.write()
}

// =====================================================
// ============= AUTO-KICK SI HABLA ====================
handler.all = async function (m) {
  try {
    if (!m.isGroup || !m.sender) return
    const db = global.db.data.users
    const sender = normalizeJid(m.sender)
    if (sender && db[sender]?.banned) {
      const reason = db[sender].banReason || 'No especificado'
      const metadata = await this.groupMetadata(m.chat)
      const inGroup = metadata.participants.some(p => normalizeJid(p.id) === sender)
      if (inGroup) {
        await this.groupParticipantsUpdate(m.chat, [sender], 'remove')
        await sleep(500)
        await this.sendMessage(m.chat, {
          text: `🚫 *Eliminado por LISTA NEGRA*\n━━━━━━━━━━━━━━━━━━━━\n@${sender.split('@')[0]} eliminado.\n📝 Motivo: ${reason}\n━━━━━━━━━━━━━━━━━━━━`,
          mentions: [sender]
        })
      }
    }
  } catch {}
}

// =====================================================
// ============= AUTO-KICK AL ENTRAR ====================
handler.before = async function (m) {
  try {
    if (![27, 31].includes(m.messageStubType)) return
    const db = global.db.data.users
    const conn = this
    for (const user of m.messageStubParameters || []) {
      const u = normalizeJid(user)
      if (!u) continue
      if (db[u]?.banned) {
        const reason = db[u].banReason || 'No especificado'
        await sleep(500)
        await conn.groupParticipantsUpdate(m.chat, [u], 'remove')
        await sleep(500)
        await conn.sendMessage(m.chat, {
          text: `🚫 *Expulsado automáticamente*\n━━━━━━━━━━━━━━━━━━━━\n@${u.split('@')[0]} eliminado.\n📝 Motivo: ${reason}\n━━━━━━━━━━━━━━━━━━━━`,
          mentions: [u]
        })
      }
    }
  } catch {}
}

// =====================================================
// ====================== CONFIG =======================
handler.help = ['addn', 'remn', 'clrn', 'listn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'clrn', 'listn']
handler.rowner = true

export default handler
