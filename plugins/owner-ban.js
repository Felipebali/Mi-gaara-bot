// 📂 plugins/propietario-listanegra.js — VERSIÓN PEDIDA POR FELI
// Expulsión por número + expulsar solo al HABLAR cuando entra + auto-kick global + remn por índice

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

// ================= HANDLER PRINCIPAL =================

const handler = async (m, { conn, command, text }) => {
  const emoji = '🚫'
  const done = '✅'
  const dbUsers = global.db.data.users || (global.db.data.users = {})

  // ===================================
  // AUTO KICK SI CITAN A UN BANEADO
  // ===================================
  if (m.isGroup && m.quoted) {
    const quotedJid = normalizeJid(m.quoted.sender || m.quoted.participant)
    if (dbUsers[quotedJid]?.banned) {
      try {
        const reason = dbUsers[quotedJid].banReason || 'No especificado'

        await conn.groupParticipantsUpdate(m.chat, [quotedJid], 'remove')
        await sleep(700)

        await conn.sendMessage(m.chat, {
          text: `🚫 @${quotedJid.split('@')[0]} fue eliminado por estar en lista negra.\n📝 Motivo: ${reason}`,
          mentions: [quotedJid]
        })
        return
      } catch { }
    }
  }

  const reactions = { addn: '✅', remn: '☢️', clrn: '🧹', listn: '📜' }
  if (reactions[command])
    await conn.sendMessage(m.chat, { react: { text: reactions[command], key: m.key } })

  const bannedList = Object.entries(dbUsers).filter(([_, data]) => data.banned)

  let userJid = null
  let numberDigits = null

  // ===========================
  // remn por número de lista
  // ===========================
  if (command === 'remn' && /^\d+$/.test(text?.trim())) {
    const i = parseInt(text.trim()) - 1
    if (!bannedList[i])
      return conn.reply(m.chat, `${emoji} Número inválido en la lista.`, m)

    userJid = bannedList[i][0]
  }

  // ====================
  // por cita
  // ====================
  else if (m.quoted)
    userJid = normalizeJid(m.quoted.sender || m.quoted.participant)

  // ====================
  // por mención
  // ====================
  else if (m.mentionedJid?.length)
    userJid = normalizeJid(m.mentionedJid[0])

  // ====================
  // por texto (número)
  // ====================
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

  // =====================
  // ADD LISTA NEGRA
  // =====================
  if (command === 'addn') {
    dbUsers[userJid].banned = true
    dbUsers[userJid].banReason = reason
    dbUsers[userJid].bannedBy = m.sender

    await conn.sendMessage(m.chat, {
      text: `${done} @${userJid.split('@')[0]} agregado a lista negra.\n📝 Motivo: ${reason}`,
      mentions: [userJid]
    })

    // 📌 NUEVO: expulsar si lo agregaron SOLO CON NÚMERO (sin cita)
    if (m.isGroup && !m.quoted && numberDigits) {
      try {
        await sleep(650)
        await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove')

        await conn.sendMessage(m.chat, {
          text: `🚫 @${userJid.split('@')[0]} expulsado por número (lista negra).`,
          mentions: [userJid]
        })
      } catch { }
    }

    // ⚡ expulsión global
    try {
      let groupsObj = await conn.groupFetchAllParticipating()
      const groups = Object.keys(groupsObj)

      for (const gid of groups) {
        await sleep(1200)
        try {
          const meta = await conn.groupMetadata(gid)
          const member = meta.participants.find(p => normalizeJid(p.id) === userJid)
          if (!member) continue

          await conn.groupParticipantsUpdate(gid, [userJid], 'remove')

          await conn.sendMessage(gid, {
            text: `🚫 @${userJid.split('@')[0]} eliminado (lista negra global).`,
            mentions: [userJid]
          })
        } catch { }
      }
    } catch { }
  }

  // =====================
  // QUITAR DE LISTA NEGRA
  // =====================
  else if (command === 'remn') {
    if (!dbUsers[userJid]?.banned)
      return conn.reply(m.chat, `${emoji} No está en lista negra.`)

    dbUsers[userJid].banned = false
    dbUsers[userJid].banReason = ''

    await conn.sendMessage(m.chat, {
      text: `${done} @${userJid.split('@')[0]} eliminado de la lista negra.`,
      mentions: [userJid]
    })
  }

  // =====================
  // LISTAR
  // =====================
  else if (command === 'listn') {
    if (bannedList.length === 0)
      return conn.sendMessage(m.chat, { text: `${done} Lista negra vacía.` })

    let msg = '🚫 *Lista negra:*\n\n'
    const mentions = []

    bannedList.forEach(([jid, data], i) => {
      msg += `*${i + 1}.* @${jid.split('@')[0]}\nMotivo: ${data.banReason}\n\n`
      mentions.push(jid)
    })

    await conn.sendMessage(m.chat, { text: msg.trim(), mentions })
  }

  // =====================
  // LIMPIAR
  // =====================
  else if (command === 'clrn') {
    for (const jid in dbUsers) {
      if (dbUsers[jid]?.banned) {
        dbUsers[jid].banned = false
        dbUsers[jid].banReason = ''
      }
    }
    await conn.sendMessage(m.chat, { text: `${done} Lista negra vaciada.` })
  }

  if (global.db.write) await global.db.write()
}

// ================= AUTO-KICK SI HABLA =================

handler.all = async function (m) {
  try {
    if (!m.isGroup || !m.sender) return

    const db = global.db.data.users
    const sender = normalizeJid(m.sender)

    if (db[sender]?.banned) {
      const reason = db[sender].banReason || 'No especificado'

      await this.groupParticipantsUpdate(m.chat, [sender], 'remove')
      await sleep(700)

      await this.sendMessage(m.chat, {
        text: `🚫 @${sender.split('@')[0]} eliminado por hablar (lista negra).\n📝 Motivo: ${reason}`,
        mentions: [sender]
      })
    }
  } catch { }
}

// =========== NO AUTO-KICK AL ENTRAR ===========
// pedido por Feli → solo expulsar CUANDO HABLE, no al entrar

// ================= CONFIG FINAL =================

handler.help = ['addn', 'remn', 'clrn', 'listn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'clrn', 'listn']
handler.rowner = true

export default handler
