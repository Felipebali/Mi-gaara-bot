// 📂 plugins/propietario-listanegra.js — VERSIÓN PERMITIR +598 (FELI 2025)
// Ahora con getRealJid() — FIX COMPLETO DE BAILEYS 2025

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ================================================
// ============= FIX: OBTENER JID REAL ============
// ================================================
function getRealJid(p) {
  if (!p) return null

  // Si ya es string normal
  if (typeof p === 'string') return normalizeJid(p)

  // Baileys moderno → p.id._serialized
  if (p.id?._serialized)
    return normalizeJid(p.id._serialized)

  // Baileys en forma de objeto user/server
  if (p.id?.user && p.id?.server)
    return normalizeJid(`${p.id.user}@${p.id.server}`)

  if (p.user && p.server)
    return normalizeJid(`${p.user}@${p.server}`)

  return null
}

// =================================================
// ============= NORMALIZAR JID 2025 ===============
// =================================================
function normalizeJid(jid = '') {
  if (!jid) return null
  jid = jid.toString().trim()

  jid = jid.replace(/[^0-9@.a-z]/gi, '')

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

  // =============================================
  // ============ AUTO-KICK POR CITAR ============
  // =============================================
  if (m.isGroup && m.quoted) {

    const quotedJid = getRealJid(m.quoted.sender || m.quoted.participant)

    if (quotedJid && dbUsers[quotedJid]?.banned) {

      try {
        const reason = dbUsers[quotedJid].banReason || 'No especificado'
        const md = await conn.groupMetadata(m.chat)

        const inGroup = md.participants.some(p => getRealJid(p) === quotedJid)

        if (inGroup) {
          await conn.groupParticipantsUpdate(m.chat, [quotedJid], 'remove')
          await sleep(500)

          await conn.sendMessage(m.chat, {
            text: `${emoji} *Eliminación inmediata por LISTA NEGRA*\n${SEP}\n@${quotedJid.split('@')[0]} eliminado.\n📝 Motivo: ${reason}\n${SEP}`,
            mentions: [quotedJid]
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

  // remn por índice
  if (command === 'remn' && /^\d+$/.test(text?.trim())) {
    const idx = parseInt(text.trim()) - 1
    if (!bannedList[idx])
      return conn.reply(m.chat, `${emoji} Número inválido.`, m)
    userJid = bannedList[idx][0]
  }
  else if (m.quoted) userJid = getRealJid(m.quoted.sender || m.quoted.participant)
  else if (m.mentionedJid?.length) userJid = getRealJid(m.mentionedJid[0])
  else if (text) {
    const num = extractPhoneNumber(text)
    if (num) userJid = normalizeJid(num)
  }

  let reason = text?.replace(/@/g, '').replace(/\d{5,}/g, '').trim() || 'No especificado'

  if (!userJid && !['listn', 'clrn'].includes(command))
    return conn.reply(m.chat, `${warn} Debes responder, mencionar o usar índice.`, m)

  if (userJid && !dbUsers[userJid]) dbUsers[userJid] = {}

  // =============================================
  // ============== AÑADIR A LISTA ===============
  // =============================================

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
        const inGroup = md.participants.some(p => getRealJid(p) === userJid)

        if (inGroup) {
          await sleep(300)
          await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove')
          await sleep(500)
          await conn.sendMessage(m.chat, {
            text: `${emoji} *Expulsión inmediata*\n${SEP}\n@${userJid.split('@')[0]} eliminado.\n📝 Motivo: ${reason}\n${SEP}`,
            mentions: [userJid]
          })
        }
      } catch {}
    }

    // Expulsión en TODOS los grupos
    try {
      const groupsObj = await conn.groupFetchAllParticipating()
      const groups = Object.keys(groupsObj)

      for (const gid of groups) {
        await sleep(1000)

        try {
          const group = await conn.groupMetadata(gid)

          const member = group.participants.find(p => getRealJid(p) === userJid)

          if (!member) continue

          const jidToKick = getRealJid(member)

          if (!jidToKick) continue

          await conn.groupParticipantsUpdate(gid, [jidToKick], 'remove')
          await sleep(300)

          await conn.sendMessage(gid, {
            text: `${emoji} @${jidToKick.split('@')[0]} eliminado por LISTA NEGRA.\n📝 Motivo: ${reason}`,
            mentions: [jidToKick]
          })

        } catch {}
      }
    } catch {}
  }

  // =============================================
  // ================ REMOVER ====================
  // =============================================
  else if (command === 'remn') {

    if (!dbUsers[userJid]?.banned)
      return conn.reply(m.chat, `${emoji} No está en la lista negra.`, m)

    dbUsers[userJid].banned = false
    dbUsers[userJid].banReason = ''
    dbUsers[userJid].bannedBy = null

    await conn.sendMessage(m.chat, {
      text: `${ok} *Removido de LISTA NEGRA*\n${SEP}\n@${userJid.split('@')[0]} removido.`,
      mentions: [userJid]
    })
  }

  // =============================================
  // ================= LISTAR ====================
  // =============================================
  else if (command === 'listn') {

    if (bannedList.length === 0)
      return conn.reply(m.chat, `${ok} Lista negra vacía.`, m)

    let msg = `🚫 *Lista Negra — ${bannedList.length}*\n${SEP}\n`
    const mentions = []

    bannedList.forEach(([jid, data], i) => {
      msg += `*${i + 1}.* @${jid.split('@')[0]}\n📝 ${data.banReason}\n\n`
      mentions.push(jid)
    })

    msg += SEP

    await conn.sendMessage(m.chat, { text: msg.trim(), mentions })
  }

  // =============================================
  // ================== LIMPIAR ==================
  // =============================================
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
    const sender = getRealJid(m.sender)

    if (sender && db[sender]?.banned) {
      const reason = db[sender].banReason || 'No especificado'

      const md = await this.groupMetadata(m.chat)
      const inGroup = md.participants.some(p => getRealJid(p) === sender)

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
// =====================================================

handler.before = async function (m) {
  try {
    if (![27, 31].includes(m.messageStubType)) return

    const db = global.db.data.users

    for (const raw of m.messageStubParameters || []) {
      const u = getRealJid(raw)
      if (!u) continue

      if (db[u]?.banned) {
        const reason = db[u].banReason || 'No especificado'

        await sleep(500)

        await this.groupParticipantsUpdate(m.chat, [u], 'remove')
        await sleep(500)

        await this.sendMessage(m.chat, {
          text: `🚫 *Expulsado automáticamente*\n━━━━━━━━━━━━━━━━━━━━\n@${u.split('@')[0]} eliminado.\n📝 Motivo: ${reason}\n━━━━━━━━━━━━━━━━━━━━`,
          mentions: [u]
        })
      }
    }

  } catch {}
}

// =====================================================
// =============== METADATOS DEL PLUGIN ================
// =====================================================

handler.help = ['addn', 'remn', 'clrn', 'listn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'clrn', 'listn']
handler.rowner = true

export default handler
