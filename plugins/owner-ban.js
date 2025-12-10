// 📂 plugins/propietario-listanegra.js — ULTRA FINAL
// EXPULSIÓN GLOBAL INMEDIATA SIEMPRE → CON NÚMERO, MENCIÓN O CITA

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

const handler = async (m, { conn, command, text }) => {
  const dbUsers = global.db.data.users || (global.db.data.users = {})
  const emoji = '🚫'
  const done = '✅'

  let userJid = null
  let numberDigits = null

  if (m.quoted)
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

  if (!userJid && command !== 'listn' && command !== 'clrn')
    return conn.reply(m.chat, `${emoji} Debes responder, mencionar o poner número.`, m)

  if (userJid && !dbUsers[userJid]) dbUsers[userJid] = {}

  let reason = text?.replace(/@/g, '').replace(/\d{5,}/g, '').trim()
  if (!reason) reason = 'No especificado'

  // =============================
  // 🚫 ADD LISTA NEGRA → SIEMPRE AUTO-KICK GLOBAL INMEDIATO
  // =============================
  if (command === 'addn') {
    dbUsers[userJid].banned = true
    dbUsers[userJid].banReason = reason
    dbUsers[userJid].bannedBy = m.sender

    await conn.sendMessage(m.chat, {
      text: `${done} @${userJid.split('@')[0]} agregado a lista negra.\n📝 Motivo: ${reason}`,
      mentions: [userJid]
    })

    // ⚠️ EXPULSIÓN INMEDIATA EN ESTE GRUPO SI ESTÁ PRESENTE
    if (m.isGroup) {
      try {
        await sleep(400)
        await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove')
      } catch {}
    }

    // ⚠️ EXPULSIÓN GLOBAL INMEDIATA DE TODOS LOS GRUPOS
    let groupsObj = await conn.groupFetchAllParticipating()
    const groups = Object.keys(groupsObj)

    for (const gid of groups) {
      await sleep(1000)
      try {
        const meta = await conn.groupMetadata(gid)
        const member = meta.participants.find(p => normalizeJid(p.id) === userJid)

        if (!member) continue

        await conn.groupParticipantsUpdate(gid, [userJid], 'remove')
        await sleep(400)

        await conn.sendMessage(gid, {
          text: `🚫 @${userJid.split('@')[0]} fue eliminado por estar en *lista negra*.\n📝 Motivo: ${reason}`,
          mentions: [userJid]
        })
      } catch {}
    }
  }

  // =============================
  // 🚮 REMOVER LISTA NEGRA
  // =============================
  else if (command === 'remn') {
    if (!dbUsers[userJid]?.banned)
      return conn.sendMessage(m.chat, { text: `${emoji} No está en lista negra.` })

    dbUsers[userJid].banned = false
    dbUsers[userJid].banReason = ''
    dbUsers[userJid].bannedBy = null

    await conn.sendMessage(m.chat, {
      text: `${done} @${userJid.split('@')[0]} eliminado de lista negra.`,
      mentions: [userJid]
    })
  }

  // =============================
  // 📜 LISTAR
  // =============================
  else if (command === 'listn') {
    const banned = Object.entries(dbUsers).filter(([_, d]) => d.banned)
    if (banned.length === 0)
      return conn.sendMessage(m.chat, { text: `${done} Lista negra vacía.` })

    let msg = '🚫 *Lista negra:*\n\n'
    const mentions = []

    banned.forEach(([jid, d], i) => {
      msg += `*${i + 1}.* @${jid.split('@')[0]}\nMotivo: ${d.banReason}\n\n`
      mentions.push(jid)
    })

    await conn.sendMessage(m.chat, { text: msg.trim(), mentions })
  }

  // =============================
  // 🧹 LIMPIAR LISTA COMPLETA
  // =============================
  else if (command === 'clrn') {
    for (const jid in dbUsers) {
      if (dbUsers[jid].banned) {
        dbUsers[jid].banned = false
        dbUsers[jid].banReason = ''
        dbUsers[jid].bannedBy = null
      }
    }
    await conn.sendMessage(m.chat, { text: `${done} Lista negra limpiada.` })
  }

  if (global.db.write) await global.db.write()
}

// =============================
// 🚨 AUTO-KICK SI HABLA
// =============================
handler.all = async function (m) {
  if (!m.isGroup || !m.sender) return
  const db = global.db.data.users
  const sender = normalizeJid(m.sender)

  if (db[sender]?.banned) {
    await this.groupParticipantsUpdate(m.chat, [sender], 'remove')
    await sleep(400)
  }
}

// =============================
// 🚨 AUTO-KICK SI ENTRA
// =============================
handler.before = async function (m) {
  if (![27, 31].includes(m.messageStubType)) return
  const db = global.db.data.users

  for (const u of m.messageStubParameters || []) {
    const jid = normalizeJid(u)
    if (!db[jid]?.banned) continue

    await sleep(500)
    await this.groupParticipantsUpdate(m.chat, [jid], 'remove')
  }
}

handler.help = ['addn', 'remn', 'clrn', 'listn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'clrn', 'listn']
handler.rowner = true

export default handler
