// 📂 plugins/propietario-listanegra.js — AUTO-KICK TOTAL
// (POR CITA, MENCIÓN, NÚMERO, HABLAR Y AL ENTRAR)

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
    if (pd === numberDigits || pd.endsWith(numberDigits) || numberDigits.endsWith(pd))
      return p.id || p
    if (pd.includes(numberDigits) || numberDigits.includes(pd))
      return p.id || p
  }
  return null
}

// ================= HANDLER PRINCIPAL =================

const handler = async (m, { conn, command, text }) => {

  const dbUsers = global.db.data.users || (global.db.data.users = {})
  const reactions = { addn: '✅', remn: '☢️', clrn: '🧹', listn: '📜' }

  if (reactions[command])
    await conn.sendMessage(m.chat, { react: { text: reactions[command], key: m.key } })

  const bannedList = Object.entries(dbUsers).filter(([_, d]) => d.banned)

  let userJid = null
  let numberDigits = null

  // ========== AUTO-KICK POR CITA ==========
  if (m.isGroup && m.quoted) {
    const q = normalizeJid(m.quoted.sender || m.quoted.participant)
    if (dbUsers[q]?.banned) {
      await conn.groupParticipantsUpdate(m.chat, [q], 'remove')
      await sleep(500)
      await conn.sendMessage(m.chat, {
        text: `🚫 @${q.split('@')[0]} expulsado (lista negra).`,
        mentions: [q],
      })
      return
    }
  }

  // ========== REMOVER POR ÍNDICE ==========
  if (command === 'remn' && /^\d+$/.test(text?.trim())) {
    const index = parseInt(text.trim()) - 1
    if (!bannedList[index])
      return conn.reply(m.chat, '🚫 Número inválido en la lista.', m)
    userJid = bannedList[index][0]
  }

  // ========== MENCIÓN ==========
  else if (m.mentionedJid?.length) {
    const mention = normalizeJid(m.mentionedJid[0])
    userJid = mention

    if (dbUsers[mention]?.banned) {
      await conn.groupParticipantsUpdate(m.chat, [mention], 'remove')
      await sleep(500)
      await conn.sendMessage(m.chat, {
        text: `🚫 @${mention.split('@')[0]} expulsado (lista negra).`,
        mentions: [mention],
      })
      return
    }
  }

  // ========== DETECCIÓN POR NÚMERO ==========
  else if (text) {
    const num = extractPhoneNumber(text)
    if (num) {
      numberDigits = num
      const jid = normalizeJid(num)
      userJid = jid

      if (dbUsers[jid]?.banned) {
        await conn.groupParticipantsUpdate(m.chat, [jid], 'remove')
        await sleep(500)
        await conn.sendMessage(m.chat, {
          text: `🚫 @${jid.split('@')[0]} expulsado (lista negra).`,
          mentions: [jid],
        })
        return
      }
    }
  }

  let reason = text?.replace(/@/g, '').replace(/\d{5,}/g, '').trim()
  if (!reason) reason = 'No especificado'

  if (!userJid && !['listn', 'clrn'].includes(command))
    return conn.reply(m.chat, '🚫 Debes responder, mencionar o escribir un número.', m)

  if (userJid && !dbUsers[userJid]) dbUsers[userJid] = {}

  // ============== AGREGAR A LISTA NEGRA ==============
  if (command === 'addn') {

    dbUsers[userJid].banned = true
    dbUsers[userJid].banReason = reason
    dbUsers[userJid].bannedBy = m.sender

    await conn.sendMessage(m.chat, {
      text: `✅ @${userJid.split('@')[0]} agregado a lista negra.\n📝 Motivo: ${reason}`,
      mentions: [userJid],
    })

    // AUTO-KICK GLOBAL
    let groupsObj = await conn.groupFetchAllParticipating()
    const groups = Object.keys(groupsObj)

    for (const jid of groups) {
      await sleep(1200)
      try {
        const group = await conn.groupMetadata(jid)

        let member = group.participants.find(p => normalizeJid(p.id) === userJid)
        if (!member && numberDigits)
          member = findMemberByNumber(group, numberDigits)

        if (!member) continue

        const memberId = member.id || member

        await conn.groupParticipantsUpdate(jid, [memberId], 'remove')
        await sleep(400)

        await conn.sendMessage(jid, {
          text: `🚫 @${memberId.split('@')[0]} expulsado (lista negra).\n📝 Motivo: ${reason}`,
          mentions: [memberId],
        })

      } catch {}
    }

  }

  // ============== QUITAR ==============
  else if (command === 'remn') {

    if (!dbUsers[userJid]?.banned)
      return conn.sendMessage(m.chat, { text: '🚫 No está en lista negra.' })

    dbUsers[userJid].banned = false
    dbUsers[userJid].banReason = ''
    dbUsers[userJid].bannedBy = null

    await conn.sendMessage(m.chat, {
      text: `✅ @${userJid.split('@')[0]} eliminado de lista negra.`,
      mentions: [userJid],
    })

  }

  // ============== LISTAR ==============
  else if (command === 'listn') {

    if (bannedList.length === 0)
      return conn.sendMessage(m.chat, { text: '📜 Lista negra vacía.' })

    let list = '🚫 Lista negra:\n\n'
    const mentions = []

    bannedList.forEach(([jid, data], i) => {
      list += `*${i + 1}.* @${jid.split('@')[0]}\nMotivo: ${data.banReason}\n\n`
      mentions.push(jid)
    })

    await conn.sendMessage(m.chat, { text: list.trim(), mentions })

  }

  // ============== LIMPIAR ==============
  else if (command === 'clrn') {

    for (const jid in dbUsers) {
      if (dbUsers[jid]?.banned) {
        dbUsers[jid].banned = false
        dbUsers[jid].banReason = ''
        dbUsers[jid].bannedBy = null
      }
    }

    await conn.sendMessage(m.chat, { text: '🧹 Lista negra vaciada.' })
  }

  if (global.db.write) await global.db.write()
}

// ================= AUTO-KICK AL HABLAR =================

handler.all = async function (m) {
  try {
    if (!m.isGroup || !m.sender) return
    const db = global.db.data.users
    const sender = normalizeJid(m.sender)

    if (db[sender]?.banned) {
      await this.groupParticipantsUpdate(m.chat, [sender], 'remove')
      await sleep(400)

      await this.sendMessage(m.chat, {
        text: `🚫 @${sender.split('@')[0]} expulsado por estar en lista negra.`,
        mentions: [sender],
      })
    }

  } catch { }
}

// ================= AUTO-KICK AL ENTRAR (FIX REAL) =================

handler.before = async function (m) {
  try {
    const db = global.db.data.users
    const conn = this

    // 📌 Si llegan nuevos usuarios (Baileys usa msgStub 32 o messageStubParameters)
    if (
      m.messageStubParameters?.length ||
      m.messageStubType === 32
    ) {
      for (const user of m.messageStubParameters || []) {
        const u = normalizeJid(user)

        if (db[u]?.banned) {
          await sleep(400)
          await conn.groupParticipantsUpdate(m.chat, [u], 'remove')
          await sleep(400)

          await conn.sendMessage(m.chat, {
            text: `🚫 @${u.split('@')[0]} expulsado automáticamente (lista negra).`,
            mentions: [u],
          })
        }
      }
    }

  } catch { }
}

// ================= CONFIG =================

handler.help = ['addn', 'remn', 'clrn', 'listn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'clrn', 'listn']
handler.rowner = true

export default handler
