// 📂 plugins/propietario-listanegra.js — FINAL DEFINITIVO PRO + REMN POR NÚMERO

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
  const emoji = '🚫'
  const done = '✅'

  const dbUsers = global.db.data.users || (global.db.data.users = {})

  const reactions = { addn: '✅', remn: '☢️', clrn: '🧹', listn: '📜', seen: '👀' }
  if (reactions[command])
    await conn.sendMessage(m.chat, { react: { text: reactions[command], key: m.key } })

  // ──────── LISTA ACTUAL ────────
  const bannedList = Object.entries(dbUsers).filter(([_, data]) => data.banned)

  let userJid = null
  let numberDigits = null

  // ✅ REMN POR NÚMERO DE LISTA
  if (command === 'remn' && /^\d+$/.test(text?.trim())) {
    const index = parseInt(text.trim()) - 1
    if (!bannedList[index])
      return conn.reply(m.chat, `${emoji} Número inválido en la lista.`, m)

    userJid = bannedList[index][0]
  }

  // ✅ MÉTODO NORMAL
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
      userJid = normalizeJid(num + '@s.whatsapp.net')
    }
  }

  let reason = text
    ? text.replace(/@/g, '').replace(/\d{5,}/g, '').trim()
    : 'No especificado'
  if (!reason) reason = 'No especificado'

  if (!userJid && !['listn', 'clrn'].includes(command))
    return conn.reply(m.chat, `${emoji} Debes responder, mencionar, escribir número o usar número de lista.`, m)

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
  }

  // ✅ REMOVER (BY @, NÚMERO O ÍNDICE)
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

  // ✅ LISTA NUMERADA
  else if (command === 'listn') {
    if (bannedList.length === 0)
      return conn.sendMessage(m.chat, { text: `${done} No hay usuarios en lista negra.` })

    let list = '🚫 *Lista negra actual:*\n\n'
    const mentions = []

    bannedList.forEach(([jid, data], i) => {
      list += `*${i + 1}.* @${jid.split('@')[0]}\nMotivo: ${data.banReason}\n\n`
      mentions.push(jid)
    })

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

// ✅ AUTO-KICK AL ENTRAR
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
