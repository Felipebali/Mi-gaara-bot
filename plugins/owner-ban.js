// 📂 plugins/propietario-listanegra.js — FINAL DEFINITIVO REAL
// (NUM LISTA + AUTOKICK GLOBAL + AVISO SI HABLA + AVISO SI ENTRA + AUTO-KICK POR CITA)

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
    if (pd === numberDigits || pd.endsWith(numberDigits) || numberDigits.endsWith(pd)) return p.id || p
    if (pd.includes(numberDigits) || numberDigits.includes(pd)) return p.id || p
  }
  return null
}

// ================= HANDLER PRINCIPAL =================

const handler = async (m, { conn, command, text }) => {
  const emoji = '🚫'
  const done = '✅'
  const dbUsers = global.db.data.users || (global.db.data.users = {})

  // ✅ AUTO-KICK INMEDIATO SI SOLO LO CITAN
  if (m.isGroup && m.quoted) {
    const quotedJid = normalizeJid(m.quoted.sender || m.quoted.participant)
    if (dbUsers[quotedJid]?.banned) {
      try {
        const reason = dbUsers[quotedJid].banReason || 'No especificado'

        await conn.groupParticipantsUpdate(m.chat, [quotedJid], 'remove')
        await sleep(800)

        await conn.sendMessage(m.chat, {
          text: `🚫 @${quotedJid.split('@')[0]} fue eliminado inmediatamente por estar en *lista negra*.\n📝 Motivo: ${reason}`,
          mentions: [quotedJid]
        })
        return
      } catch {}
    }
  }

  const reactions = { addn: '✅', remn: '☢️', clrn: '🧹', listn: '📜' }
  if (reactions[command])
    await conn.sendMessage(m.chat, { react: { text: reactions[command], key: m.key } })

  const bannedList = Object.entries(dbUsers).filter(([_, data]) => data.banned)

  let userJid = null
  let numberDigits = null

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

  // ✅ ADD LISTA NEGRA + EXPULSIÓN GLOBAL + EXPULSIÓN INMEDIATA SI ES POR CITA
  if (command === 'addn') {
    dbUsers[userJid].banned = true
    dbUsers[userJid].banReason = reason
    dbUsers[userJid].bannedBy = m.sender

    await conn.sendMessage(m.chat, {
      text: `${done} @${userJid.split('@')[0]} agregado a lista negra.\n📝 Motivo: ${reason}`,
      mentions: [userJid]
    })

    // ✅ EXPULSIÓN INMEDIATA EN ESTE GRUPO SI FUE POR CITA
    if (m.isGroup && m.quoted) {
      try {
        await sleep(500)
        await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove')
        await sleep(800)

        await conn.sendMessage(m.chat, {
          text: `🚫 @${userJid.split('@')[0]} eliminado inmediatamente por estar en *lista negra*.\n📝 Motivo: ${reason}`,
          mentions: [userJid]
        })
      } catch {}
    }

    let groupsObj = await conn.groupFetchAllParticipating()
    const groups = Object.keys(groupsObj)

    for (const jid of groups) {
      await sleep(1800)
      try {
        const group = await conn.groupMetadata(jid)
        let member = group.participants.find(p => normalizeJid(p.id) === userJid)
        if (!member && numberDigits) member = findMemberByNumber(group, numberDigits)
        if (!member) continue

        const memberId = member.id || member

        await conn.groupParticipantsUpdate(jid, [memberId], 'remove')
        await sleep(800)

        await conn.sendMessage(jid, {
          text: `🚫 @${memberId.split('@')[0]} eliminado por estar en *lista negra*.\n📝 Motivo: ${reason}`,
          mentions: [memberId]
        })
      } catch {}
    }
  }

  // ✅ REMOVER DE LISTA NEGRA
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

  // ✅ LISTAR
  else if (command === 'listn') {
    if (bannedList.length === 0)
      return conn.sendMessage(m.chat, { text: `${done} Lista negra vacía.` })

    let list = '🚫 *Lista negra:*\n\n'
    const mentions = []

    bannedList.forEach(([jid, data], i) => {
      list += `*${i + 1}.* @${jid.split('@')[0]}\nMotivo: ${data.banReason}\n\n`
      mentions.push(jid)
    })

    await conn.sendMessage(m.chat, { text: list.trim(), mentions })
  }

  // ✅ LIMPIAR LISTA
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

// ================= AUTO-KICK SI HABLA + AVISO =================

handler.all = async function (m) {
  try {
    if (!m.isGroup || !m.sender) return

    const db = global.db.data.users
    const sender = normalizeJid(m.sender)

    if (db[sender]?.banned) {
      const reason = db[sender].banReason || 'No especificado'

      await this.groupParticipantsUpdate(m.chat, [sender], 'remove')
      await sleep(800)

      await this.sendMessage(m.chat, {
        text: `🚫 @${sender.split('@')[0]} fue eliminado por estar en *lista negra*.\n📝 Motivo: ${reason}`,
        mentions: [sender]
      })
    }
  } catch {}
}

// ================= AUTO-KICK AL ENTRAR + AVISO =================

handler.before = async function (m) {
  try {
    if (![27, 31].includes(m.messageStubType)) return
    const db = global.db.data.users
    const conn = this

    for (const user of m.messageStubParameters || []) {
      const u = normalizeJid(user)

      if (db[u]?.banned) {
        const reason = db[u].banReason || 'No especificado'

        await sleep(600)
        await conn.groupParticipantsUpdate(m.chat, [u], 'remove')
        await sleep(800)

        await conn.sendMessage(m.chat, {
          text: `🚫 @${u.split('@')[0]} fue eliminado automáticamente por estar en *lista negra*.\n📝 Motivo: ${reason}`,
          mentions: [u]
        })
      }
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
