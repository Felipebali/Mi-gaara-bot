// 📂 plugins/propietario-listanegra.js — FINAL DEFINITIVO AUTO-KICK PERFECTO

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function normalizeJid(jid = '') {
  if (!jid) return null
  jid = jid.toString().trim()
  jid = jid.replace(/^\+/, '')

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

const handler = async (m, { conn, command, text }) => {
  const emoji = '🚫'
  const done = '✅'

  const dbUsers = global.db.data.users || (global.db.data.users = {})

  const reactions = { addn: '✅', remn: '☢️', clrn: '🧹', listn: '📜', seen: '👀' }
  if (reactions[command])
    await conn.sendMessage(m.chat, { react: { text: reactions[command], key: m.key } })

  let userJid = null
  let numberDigits = null

  if (m.quoted) {
    userJid = normalizeJid(m.quoted.sender || m.quoted.participant)
  } else if (m.mentionedJid?.length) {
    userJid = normalizeJid(m.mentionedJid[0])
  } else if (text) {
    const num = extractPhoneNumber(text)
    if (num) {
      numberDigits = num
      userJid = normalizeJid(num + '@s.whatsapp.net')
    }
  }

  let reason = text
    ? text.replace(/@/g, '').replace(/\d{5,}/g, '').trim()
    : 'No especificado'
  if (!reason) reason = 'No especificado'

  if (!userJid && !['listn', 'clrn', 'seen'].includes(command))
    return conn.reply(m.chat, `${emoji} Debes responder, mencionar o escribir el número.`, m)

  if (userJid && !dbUsers[userJid]) dbUsers[userJid] = {}

  // ✅ ADD LISTA NEGRA
  if (command === 'addn') {
    dbUsers[userJid].banned = true
    dbUsers[userJid].banReason = reason
    dbUsers[userJid].bannedBy = m.sender

    await conn.sendMessage(m.chat, {
      text: `${done} @${userJid.split('@')[0]} agregado a lista negra.\n\n📝 Motivo: ${reason}`,
      mentions: [userJid]
    })

    let groupsObj = {}
    try {
      groupsObj = await conn.groupFetchAllParticipating()
    } catch (e) {
      groupsObj = {}
    }

    const groups = Object.keys(groupsObj).slice(0, 80)

    for (const jid of groups) {
      await sleep(2000)
      try {
        const group = await conn.groupMetadata(jid)
        let member = group.participants.find(p => normalizeJid(p.id) === normalizeJid(userJid))
        if (!member && numberDigits) member = findMemberByNumber(group, numberDigits)

        if (member) {
          const memberId = member.id || member
          await conn.groupParticipantsUpdate(jid, [memberId], 'remove')
          await sleep(800)

          await conn.sendMessage(jid, {
            text: `🚫 @${memberId.split('@')[0]} eliminado por lista negra.\n📝 Motivo: ${reason}`,
            mentions: [memberId]
          })
        }
      } catch (e) {}
    }
  }

  // ✅ REMOVER
  else if (command === 'remn') {
    if (!dbUsers[userJid]?.banned)
      return conn.sendMessage(m.chat, {
        text: `${emoji} @${userJid.split('@')[0]} no está en lista negra.`,
        mentions: [userJid]
      })

    dbUsers[userJid].banned = false
    dbUsers[userJid].banReason = ''
    dbUsers[userJid].bannedBy = null

    await conn.sendMessage(m.chat, {
      text: `${done} @${userJid.split('@')[0]} eliminado de la lista negra.`,
      mentions: [userJid]
    })
  }

  // ✅ CONSULTAR
  else if (command === 'seen') {
    if (!dbUsers[userJid]?.banned)
      return conn.sendMessage(m.chat, {
        text: `✅ @${userJid.split('@')[0]} no está en la lista negra.`,
        mentions: [userJid]
      })

    await conn.sendMessage(m.chat, {
      text: `🚫 @${userJid.split('@')[0]} está en la lista negra.\n📝 Motivo: ${dbUsers[userJid].banReason}`,
      mentions: [userJid]
    })
  }

  // ✅ LISTA
  else if (command === 'listn') {
    const bannedUsers = Object.entries(dbUsers).filter(([_, data]) => data.banned)
    if (bannedUsers.length === 0)
      return conn.sendMessage(m.chat, { text: `${done} No hay usuarios en lista negra.` })

    let list = '🚫 *Lista negra actual:*\n\n'
    const mentions = []

    for (const [jid, data] of bannedUsers) {
      list += `• @${jid.split('@')[0]}\nMotivo: ${data.banReason}\n\n`
      mentions.push(jid)
    }

    await conn.sendMessage(m.chat, { text: list.trim(), mentions })
  }

  // ✅ LIMPIAR
  else if (command === 'clrn') {
    for (const jid in dbUsers) {
      if (dbUsers[jid]?.banned) {
        dbUsers[jid].banned = false
        dbUsers[jid].banReason = ''
        dbUsers[jid].bannedBy = null
      }
    }
    await conn.sendMessage(m.chat, { text: `${done} La lista negra fue vaciada.` })
  }

  if (global.db.write) await global.db.write()
}

// ✅ AUTO-KICK SI HABLA
handler.all = async function (m) {
  try {
    if (!m.isGroup || !m.sender) return
    const conn = this
    const db = global.db.data.users
    const sender = normalizeJid(m.sender)

    if (db[sender]?.banned) {
      const reason = db[sender].banReason || 'No especificado'
      await conn.groupParticipantsUpdate(m.chat, [sender], 'remove')
      await sleep(800)
      await conn.sendMessage(m.chat, {
        text: `🚫 @${sender.split('@')[0]} fue expulsado.\n📝 Motivo: ${reason}`,
        mentions: [sender]
      })
    }
  } catch {}
}

// ✅ AUTO-KICK AL ENTRAR (SIN handler)
handler.before = async function (m) {
  try {
    if (!m.messageStubType || !m.isGroup) return
    const ENTER_EVENTS = [27, 31]
    if (!ENTER_EVENTS.includes(m.messageStubType)) return

    const conn = this
    const db = global.db.data.users
    const users = m.messageStubParameters || []

    for (const user of users) {
      const u = normalizeJid(user)
      if (db[u]?.banned) {
        const reason = db[u].banReason || 'No especificado'
        await sleep(500)
        await conn.groupParticipantsUpdate(m.chat, [u], 'remove')
        await sleep(700)
        await conn.sendMessage(m.chat, {
          text: `🚫 @${u.split('@')[0]} fue eliminado automáticamente.\n📝 Motivo: ${reason}`,
          mentions: [u]
        })
      }
    }
  } catch {}
}

handler.help = ['addn', 'remn', 'clrn', 'listn', 'seen']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'clrn', 'listn', 'seen']
handler.rowner = true

export default handler
