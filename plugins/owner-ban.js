// 📂 plugins/propietario-listanegra.js — FIX FINAL 100%
// (NUM ESCRITO + LISTA + AUTOKICK GLOBAL + HABLA + ENTRA + CITA)

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ================= UTILIDADES =================

function normalizeJid(jid = '') {
  if (!jid) return null
  jid = jid.toString().trim().replace(/^\+/, '')
  if (jid.endsWith('@c.us')) return jid.replace('@c.us', '@s.whatsapp.net')
  if (jid.endsWith('@s.whatsapp.net')) return jid
  return jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
}

function digitsOnly(t = '') {
  return (t || '').toString().replace(/[^0-9]/g, '')
}

function extractPhoneNumber(text = '') {
  const d = digitsOnly(text)
  if (!d || d.length < 7) return null
  return d
}

// ================= HANDLER PRINCIPAL =================

const handler = async (m, { conn, command, text }) => {
  const emoji = '🚫'
  const done = '✅'
  const db = global.db.data.users || (global.db.data.users = {})

  // ================= AUTO-KICK SI SOLO LO CITAN =================
  if (m.isGroup && m.quoted) {
    const q = normalizeJid(m.quoted.sender || m.quoted.participant)
    if (db[q]?.banned) {
      const reason = db[q].banReason || 'No especificado'
      await conn.groupParticipantsUpdate(m.chat, [q], 'remove')
      await sleep(600)
      await conn.sendMessage(m.chat, {
        text: `🚫 @${q.split('@')[0]} eliminado por *lista negra*.\n📝 Motivo: ${reason}`,
        mentions: [q]
      })
      return
    }
  }

  const reacts = { addn: '✅', remn: '☢️', clrn: '🧹', listn: '📜' }
  if (reacts[command])
    await conn.sendMessage(m.chat, { react: { text: reacts[command], key: m.key } })

  const bannedList = Object.entries(db).filter(([_, d]) => d.banned)

  let userJid = null
  let numberDigits = null

  // ================= OBTENER OBJETIVO =================

  if (command === 'remn' && /^\d+$/.test(text?.trim())) {
    const idx = parseInt(text.trim()) - 1
    if (!bannedList[idx])
      return conn.reply(m.chat, `${emoji} Índice inválido.`, m)
    userJid = bannedList[idx][0]
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

  let reason = text?.replace(/@\S+/g, '').replace(/\d{7,}/g, '').trim()
  if (!reason) reason = 'No especificado'

  if (!userJid && !['listn', 'clrn'].includes(command))
    return conn.reply(m.chat, `${emoji} Responde, menciona o escribe un número.`, m)

  if (userJid && !db[userJid]) db[userJid] = {}

  // ================= ADD LISTA NEGRA =================

  if (command === 'addn') {
    db[userJid].banned = true
    db[userJid].banReason = reason
    db[userJid].bannedBy = m.sender

    await conn.sendMessage(m.chat, {
      text: `${done} @${userJid.split('@')[0]} agregado a *lista negra*.\n📝 Motivo: ${reason}`,
      mentions: [userJid]
    })

    const groups = Object.keys(await conn.groupFetchAllParticipating())

    for (const gid of groups) {
      await sleep(1500)
      try {
        const meta = await conn.groupMetadata(gid)
        let target = null

        for (const p of meta.participants) {
          const pid = digitsOnly(p.id)
          if (
            pid === numberDigits ||
            pid.endsWith(numberDigits) ||
            numberDigits?.endsWith(pid) ||
            pid.includes(numberDigits)
          ) {
            target = p.id
            break
          }
        }

        if (!target) continue

        await conn.groupParticipantsUpdate(gid, [target], 'remove')
        await sleep(600)

        await conn.sendMessage(gid, {
          text: `🚫 @${target.split('@')[0]} eliminado por *lista negra*.\n📝 Motivo: ${reason}`,
          mentions: [target]
        })
      } catch {}
    }
  }

  // ================= REMOVER =================

  else if (command === 'remn') {
    if (!db[userJid]?.banned)
      return conn.sendMessage(m.chat, { text: `${emoji} No está en lista negra.` })

    db[userJid].banned = false
    db[userJid].banReason = ''
    db[userJid].bannedBy = null

    await conn.sendMessage(m.chat, {
      text: `${done} @${userJid.split('@')[0]} removido de la lista negra.`,
      mentions: [userJid]
    })
  }

  // ================= LISTAR =================

  else if (command === 'listn') {
    if (!bannedList.length)
      return conn.sendMessage(m.chat, { text: `${done} Lista negra vacía.` })

    let txt = '🚫 *LISTA NEGRA*\n\n'
    const mentions = []

    bannedList.forEach(([jid, d], i) => {
      txt += `*${i + 1}.* @${jid.split('@')[0]}\nMotivo: ${d.banReason}\n\n`
      mentions.push(jid)
    })

    await conn.sendMessage(m.chat, { text: txt.trim(), mentions })
  }

  // ================= LIMPIAR =================

  else if (command === 'clrn') {
    for (const u in db) {
      if (db[u]?.banned) {
        db[u].banned = false
        db[u].banReason = ''
        db[u].bannedBy = null
      }
    }
    await conn.sendMessage(m.chat, { text: `${done} Lista negra vaciada.` })
  }

  if (global.db.write) await global.db.write()
}

// ================= AUTO-KICK SI HABLA =================

handler.all = async function (m) {
  if (!m.isGroup || !m.sender) return
  const db = global.db.data.users
  const s = normalizeJid(m.sender)

  if (db[s]?.banned) {
    const r = db[s].banReason || 'No especificado'
    await this.groupParticipantsUpdate(m.chat, [s], 'remove')
    await sleep(500)
    await this.sendMessage(m.chat, {
      text: `🚫 @${s.split('@')[0]} eliminado por *lista negra*.\n📝 Motivo: ${r}`,
      mentions: [s]
    })
  }
}

// ================= AUTO-KICK AL ENTRAR =================

handler.before = async function (m) {
  if (![27, 31].includes(m.messageStubType)) return
  const db = global.db.data.users
  const conn = this

  for (const u of m.messageStubParameters || []) {
    const jid = normalizeJid(u)
    if (db[jid]?.banned) {
      const r = db[jid].banReason || 'No especificado'
      await sleep(500)
      await conn.groupParticipantsUpdate(m.chat, [jid], 'remove')
      await sleep(600)
      await conn.sendMessage(m.chat, {
        text: `🚫 @${jid.split('@')[0]} eliminado automáticamente por *lista negra*.\n📝 Motivo: ${r}`,
        mentions: [jid]
      })
    }
  }
}

// ================= CONFIG =================

handler.help = ['addn', 'remn', 'listn', 'clrn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'listn', 'clrn']
handler.rowner = true

export default handler
