// 📂 plugins/propietario-listanegra.js — ULTRA FINAL + AVISO EN TODOS LOS CASOS (ARREGLADO)

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function normalizeJid(jid = '') {
  if (!jid) return null
  jid = jid.toString().trim()
  // eliminar caracteres no numéricos iniciales excepto @
  if (jid.startsWith('+')) jid = jid.replace(/^\+/, '')
  // si ya trae dominio
  if (jid.endsWith('@c.us') || jid.endsWith('@s.whatsapp.net'))
    return jid.replace(/@c.us$/, '@s.whatsapp.net')
  if (jid.includes('@')) return jid
  // dejar solo dígitos y añadir dominio
  return jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
}

function digitsOnly(txt = '') {
  return (txt || '').toString().replace(/[^0-9]/g, '')
}

function extractPhoneNumber(txt = '') {
  const d = digitsOnly(txt)
  if (!d || d.length < 5) return null
  return d
}

const handler = async (m, { conn, command, text }) => {
  const dbUsers = global.db.data.users || (global.db.data.users = {})
  const emoji = '🚫'
  const done = '✅'

  let userJid = null
  let numberDigits = null

  // prioridad: respuesta citada -> m.quoted, luego m.mentionedJid, luego texto/numero
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

  if (!userJid && !['listn', 'clrn'].includes(command))
    return conn.reply(m.chat, `${emoji} Debes responder, mencionar o poner número.`, m)

  if (userJid && !dbUsers[userJid]) dbUsers[userJid] = {}

  let reason = text?.replace(/@/g, '').replace(/\d{5,}/g, '').trim()
  if (!reason) reason = 'No especificado'

  // ==========================================
  // 🚫 AGREGAR A LISTA NEGRA + EXPULSIÓN GLOBAL + AVISO
  // ==========================================
  if (command === 'addn') {
    dbUsers[userJid].banned = true
    dbUsers[userJid].banReason = reason
    dbUsers[userJid].bannedBy = m.sender

    await conn.sendMessage(m.chat, {
      text: `${done} @${userJid.split('@')[0]} añadido a *lista negra*.\n📝 Motivo: ${reason}`,
      mentions: [userJid]
    })

    // 🔥 EXPULSIÓN INMEDIATA EN ESTE GRUPO (si aplica)
    if (m.isGroup) {
      try {
        await sleep(300)
        // si el miembro existe en el grupo, lo removemos; si no, el intento puede fallar tranquilo
        await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove')
        await sleep(300)
        await conn.sendMessage(m.chat, {
          text: `🚫 @${userJid.split('@')[0]} fue eliminado de este grupo por estar en *lista negra*.`,
          mentions: [userJid]
        })
      } catch {}
    }

    // 🔥 EXPULSIÓN GLOBAL EN TODOS LOS GRUPOS + AVISO
    try {
      let groupsObj = await conn.groupFetchAllParticipating()
      const groups = Object.keys(groupsObj)

      for (const gid of groups) {
        await sleep(900)
        try {
          const meta = await conn.groupMetadata(gid)
          // buscar miembro en participants; p puede ser objeto { id, ... } o string
          const member = meta.participants.find(p => {
            const pid = (p.id || p).toString()
            return normalizeJid(pid) === userJid
          })
          if (!member) continue

          const memberId = (member.id || member).toString()
          await conn.groupParticipantsUpdate(gid, [memberId], 'remove')
          await sleep(300)

          await conn.sendMessage(gid, {
            text: `🚫 @${memberId.split('@')[0]} fue eliminado automáticamente.\n📛 Razón: Está en *lista negra*.\n📝 Motivo: ${reason}`,
            mentions: [memberId]
          })
        } catch {}
      }
    } catch {}
  }

  // ==========================================
  // 🗑 REMOVER LISTA NEGRA
  // ==========================================
  else if (command === 'remn') {
    if (!dbUsers[userJid]?.banned)
      return conn.sendMessage(m.chat, { text: `${emoji} No está en lista negra.` })

    dbUsers[userJid].banned = false
    dbUsers[userJid].banReason = ''
    dbUsers[userJid].bannedBy = null

    await conn.sendMessage(m.chat, {
      text: `${done} @${userJid.split('@')[0]} eliminado de la *lista negra*.`,
      mentions: [userJid]
    })
  }

  // ==========================================
  // 📜 LISTAR
  // ==========================================
  else if (command === 'listn') {
    const banned = Object.entries(dbUsers).filter(([_, d]) => d.banned)
    if (banned.length === 0)
      return conn.sendMessage(m.chat, { text: `${done} Lista negra vacía.` })

    let msg = '🚫 *Lista negra global:*\n\n'
    const mentions = []

    banned.forEach(([jid, d], i) => {
      msg += `*${i + 1}.* @${jid.split('@')[0]}\n📝 Motivo: ${d.banReason}\n\n`
      mentions.push(jid)
    })

    await conn.sendMessage(m.chat, { text: msg.trim(), mentions })
  }

  // ==========================================
  // 🧹 LIMPIAR TODO
  // ==========================================
  else if (command === 'clrn') {
    for (const jid in dbUsers) {
      if (dbUsers[jid].banned) {
        dbUsers[jid].banned = false
        dbUsers[jid].banReason = ''
        dbUsers[jid].bannedBy = null
      }
    }

    await conn.sendMessage(m.chat, { text: `${done} Lista negra totalmente vaciada.` })
  }

  if (global.db.write) await global.db.write()
}

// ==========================================
// 🚨 AUTO-KICK SI ENTRA O SI HABLA + AVISO (TODO EN handler.all)
// ==========================================
handler.all = async function (m) {
  try {
    if (!m.isGroup) return
    const db = global.db.data.users || {}
    const conn = this

    // ========== AUTO-KICK SI ENTRA (stubs 27,31,32 o messageStubParameters) ==========
    try {
      const stubTypes = [27, 31, 32]
      if (stubTypes.includes(m.messageStubType) || (m.messageStubParameters && m.messageStubParameters.length)) {
        const params = m.messageStubParameters || []
        for (const user of params) {
          const jid = normalizeJid(user)
          if (!db[jid]?.banned) continue

          const reason = db[jid].banReason || 'No especificado'

          await sleep(400)
          try {
            await conn.groupParticipantsUpdate(m.chat, [jid], 'remove')
          } catch {}
          await sleep(300)

          await conn.sendMessage(m.chat, {
            text: `🚫 @${jid.split('@')[0]} fue eliminado al entrar.\n📝 Motivo: ${reason}`,
            mentions: [jid]
          })
        }
      }
    } catch {}

    // ========== AUTO-KICK SI HABLA ==========
    try {
      if (!m.sender) return
      const sender = normalizeJid(m.sender)
      if (db[sender]?.banned) {
        const reason = db[sender].banReason || 'No especificado'

        await conn.groupParticipantsUpdate(m.chat, [sender], 'remove')
        await sleep(300)
        await conn.sendMessage(m.chat, {
          text: `🚫 @${sender.split('@')[0]} fue eliminado por hablar.\n📝 Motivo: ${reason}`,
          mentions: [sender]
        })
      }
    } catch {}

  } catch (e) {
    // prevención: no dejar que un error detenga otros plugins
    console.error('propietario-listanegra handler.all error', e)
  }
}

handler.help = ['addn', 'remn', 'clrn', 'listn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'clrn', 'listn']
handler.rowner = true

export default handler
