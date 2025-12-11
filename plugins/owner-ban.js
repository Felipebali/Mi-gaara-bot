// 📂 plugins/propietario-listanegra.js — VERSIÓN PERMITIR +598 (FELI 2025)

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// Normalizar JID — FIX COMPLETO 2025 (detecta +598 / menciones / cita / manual)
function normalizeJid(jid = '') {
  if (!jid) return null
  jid = jid.toString().trim()

  // Limpieza completa: quita +, espacios, guiones, paréntesis, emojis, etc.
  jid = jid.replace(/[^0-9@.a-z]/gi, '')

  // Si ya viene con dominio → normalizar
  if (jid.endsWith('@c.us') || jid.endsWith('@s.whatsapp.net')) {
    return jid.replace(/@c.us$/, '@s.whatsapp.net')
  }

  // Si trae @ extraño → devolver como está
  if (jid.includes('@')) return jid

  // Convertir todo lo que quede a números
  const cleaned = jid.replace(/[^0-9]/g, '')
  if (!cleaned) return null

  // Formato WhatsApp válido
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

  // AUTO-KICK POR CITAR
  if (m.isGroup && m.quoted) {
    const quotedJid = normalizeJid(m.quoted.sender || m.quoted.participant)
    if (quotedJid && dbUsers[quotedJid]?.banned) {
      try {
        const reason = dbUsers[quotedJid].banReason || 'No especificado'
        const md = await conn.groupMetadata(m.chat)

        const inGroup = md.participants.some(p => {
          const pid = (p.id || p.jid || p.participant || '').toString()
          return normalizeJid(pid) === quotedJid
        })

        if (inGroup) {
          await conn.groupParticipantsUpdate(m.chat, [quotedJid], 'remove')
          await sleep(600)
          await conn.sendMessage(m.chat, {
            text: `${emoji} *Eliminación inmediata por LISTA NEGRA*\n${SEP}\n@${quotedJid.split('@')[0]} fue eliminado.\n📝 Motivo: ${reason}\n${SEP}`,
            mentions: [quotedJid]
          })
        }
      } catch {}
    }
  }

  const reactions = { addn: '✅', remn: '☢️', clrn: '🧹', listn: '📜' }
  if (reactions[command]) await conn.sendMessage(m.chat, { react: { text: reactions[command], key: m.key } })

  const bannedList = Object.entries(dbUsers).filter(([_, d]) => d.banned)

  let userJid = null
  let numberDigits = null

  if (command === 'remn' && /^\d+$/.test(text?.trim())) {
    const index = parseInt(text.trim()) - 1
    if (!bannedList[index]) return conn.reply(m.chat, `${emoji} Número inválido.`, m)
    userJid = bannedList[index][0]
  }
  else if (m.quoted) userJid = normalizeJid(m.quoted.sender || m.quoted.participant)
  else if (m.mentionedJid?.length) userJid = normalizeJid(m.mentionedJid[0])
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

    // Expulsión inmediata del grupo actual
    if (m.isGroup) {
      try {
        const md = await conn.groupMetadata(m.chat)
        const inGroup = md.participants.some(p => {
          const pid = (p.id || p.jid || p.participant || '').toString()
          return normalizeJid(pid) === userJid
        })

        if (inGroup) {
          await sleep(400)
          await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove')
          await sleep(600)
          await conn.sendMessage(m.chat, {
            text: `${emoji} *Expulsión inmediata*\n${SEP}\n@${userJid.split('@')[0]} eliminado.\n📝 Motivo: ${reason}\n${SEP}`,
            mentions: [userJid]
          })
        }
      } catch {}
    }

    // Expulsión en TODOS los grupos
    try {
      let groupsObj = await conn.groupFetchAllParticipating()
      const groups = Object.keys(groupsObj)

      for (const jid of groups) {
        await sleep(1100)
        try {
          const group = await conn.groupMetadata(jid)

          const member = group.participants.find(p => {
            const pid = (p.id || p.jid || p.participant || '').toString()
            return normalizeJid(pid) === userJid
          })

          if (!member) continue

          await conn.groupParticipantsUpdate(jid, [member.id], 'remove')
          await sleep(400)

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
    if (bannedList.length === 0)
      return conn.reply(m.chat, `${ok} Lista negra vacía.`, m)

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
// =====================================================

handler.all = async function (m) {
  try {
    if (!m.isGroup || !m.sender) return

    const db = global.db.data.users
    const sender = normalizeJid(m.sender)

    if (sender && db[sender]?.banned) {
      const reason = db[sender].banReason || 'No especificado'

      const md = await this.groupMetadata(m.chat)
      const inGroup = md.participants.some(p => {
        const pid = (p.id || p.jid || p.participant || '').toString()
        return normalizeJid(pid) === sender
      })

      if (inGroup) {
        await this.groupParticipantsUpdate(m.chat, [sender], 'remove')
        await sleep(600)

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
// =====================================================

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

        await sleep(600)
        await conn.groupParticipantsUpdate(m.chat, [u], 'remove')
        await sleep(600)

        await conn.sendMessage(m.chat, {
          text: `🚫 *Expulsado automáticamente*\n━━━━━━━━━━━━━━━━━━━━\n@${u.split('@')[0]} eliminado.\n📝 Motivo: ${reason}\n━━━━━━━━━━━━━━━━━━━━`,
          mentions: [u]
        })
      }
    }
  } catch {}
}

handler.help = ['addn', 'remn', 'clrn', 'listn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'clrn', 'listn']
handler.rowner = true

export default handler
