// 📂 plugins/propietario-listanegra.js — VERSIÓN ACTUALIZADA FELI 2025
// (NUM LISTA + AUTOKICK GLOBAL + AVISO SI HABLA + AVISO SI ENTRA + AUTO-KICK POR CITA)
// Cambios: prohíbe agregar por número con +598 / 598... ; avisos vistosos; remn por índice; lista numerada.

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function normalizeJid(jid = '') {
  if (!jid) return null
  jid = jid.toString().trim().replace(/^\+/, '') // fixed: remove literal '+' if present
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

function findMemberByNumber(group, numberDigits) {
  if (!group || !group.participants) return null
  for (const p of group.participants) {
    const pid = (p.id || p).toString()
    const pd = digitsOnly(pid)
    if (!pd) continue
    // exact match or endsWith (local vs international), or contains
    if (pd === numberDigits || pd.endsWith(numberDigits) || numberDigits.endsWith(pd)) return p.id || p
    if (pd.includes(numberDigits) || numberDigits.includes(pd)) return p.id || p
  }
  return null
}

// ================= HANDLER PRINCIPAL =================

const handler = async (m, { conn, command, text }) => {
  const SEP = '━━━━━━━━━━━━━━━━━━━━'
  const emoji = '🚫'
  const ok = '✅'
  const warn = '⚠️'
  const dbUsers = global.db.data.users || (global.db.data.users = {})

  // ✅ AUTO-KICK INMEDIATO SI SOLO LO CITAN
  if (m.isGroup && m.quoted) {
    const quotedJid = normalizeJid(m.quoted.sender || m.quoted.participant)
    if (quotedJid && dbUsers[quotedJid]?.banned) {
      try {
        const reason = dbUsers[quotedJid].banReason || 'No especificado'
        await conn.groupParticipantsUpdate(m.chat, [quotedJid], 'remove')
        await sleep(700)
        await conn.sendMessage(m.chat, {
          text: `${emoji} *Eliminación inmediata por LISTA NEGRA*\n${SEP}\n@${quotedJid.split('@')[0]} fue eliminado por estar en *lista negra*.\n📝 Motivo: ${reason}\n${SEP}`,
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

  // REMN por índice: remn 1
  if (command === 'remn' && /^\d+$/.test(text?.trim())) {
    const index = parseInt(text.trim()) - 1
    if (!bannedList[index])
      return conn.reply(m.chat, `${emoji} Número inválido en la lista. Usa: remn 1`, m)
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
    return conn.reply(m.chat, `${warn} Debes responder, mencionar o usar índice de lista (ej: remn 1). No se permite agregar por número con +598/598...`, m)

  if (userJid && !dbUsers[userJid]) dbUsers[userJid] = {}

  // ================= VALIDACIONES ESPECÍFICAS: impedir +598 en addn =================
  // Si intentan agregar con número que contiene country code 598 (ej: +598..., 598...), lo rechazamos.
  const attemptedRawNumber = digitsOnly(text || '') // si escribieron número en text
  const hasForbidden598 = attemptedRawNumber && (attemptedRawNumber.startsWith('598') || text?.includes('+598'))
  if (command === 'addn' && hasForbidden598 && !m.quoted && !m.mentionedJid) {
    return conn.sendMessage(m.chat, {
      text: `${emoji} No está permitido agregar a la lista negra escribiendo números con prefijo +598 o 598.\n\n➡️ Usa *mencionar* o *citar* el mensaje de la persona para agregarla.\n\n${SEP}\nEjemplo válido: responde al mensaje de la persona y escribe: *addn motivo*`,
    })
  }

  // ================= ADD LISTA NEGRA + EXPULSIÓN GLOBAL + EXPULSIÓN INMEDIATA SI ES POR CITA =================
  if (command === 'addn') {
    // For safety: only allow adding when there is actually a mention/quoted (no free numbers)
    const addedByNumberInput = !!(userJid && numberDigits && (!m.mentionedJid || m.mentionedJid.length === 0) && !m.quoted)
    if (addedByNumberInput) {
      // Disallow adding by raw number (unless you want to allow - user's request was to remove +598)
      return conn.sendMessage(m.chat, {
        text: `${emoji} No se permite agregar escribiendo un número directamente. Usa mencionar o citar.` 
      })
    }

    // Ensure userJid exists
    if (!userJid)
      return conn.sendMessage(m.chat, { text: `${emoji} No pude determinar al usuario. Responde o menciona.` })

    dbUsers[userJid].banned = true
    dbUsers[userJid].banReason = reason
    dbUsers[userJid].bannedBy = m.sender

    await conn.sendMessage(m.chat, {
      text: `${ok} *Agregado a LISTA NEGRA*\n${SEP}\n@${userJid.split('@')[0]} ahora está en *lista negra*.\n📝 Motivo: ${reason}\n👤 Agregado por: @${m.sender.split('@')[0]}\n${SEP}`,
      mentions: [userJid, m.sender]
    })

    // ✅ EXPULSIÓN INMEDIATA EN ESTE GRUPO SI FUE POR CITA O MENCION
    if (m.isGroup && (m.quoted || (m.mentionedJid && m.mentionedJid.length))) {
      try {
        await sleep(500)
        await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove')
        await sleep(800)

        await conn.sendMessage(m.chat, {
          text: `${emoji} *Expulsión inmediata*\n${SEP}\n@${userJid.split('@')[0]} eliminado por estar en *lista negra*.\n📝 Motivo: ${reason}\n${SEP}`,
          mentions: [userJid]
        })
      } catch {}
    }

    // EXPULSIÓN GLOBAL: recorrer grupos y expulsar si está
    try {
      let groupsObj = await conn.groupFetchAllParticipating()
      const groups = Object.keys(groupsObj)
      for (const jid of groups) {
        await sleep(1300)
        try {
          const group = await conn.groupMetadata(jid)
          let member = group.participants.find(p => normalizeJid(p.id) === userJid)
          if (!member && numberDigits) member = findMemberByNumber(group, numberDigits)
          if (!member) continue

          const memberId = member.id || member

          await conn.groupParticipantsUpdate(jid, [memberId], 'remove')
          await sleep(700)

          await conn.sendMessage(jid, {
            text: `${emoji} @${memberId.split('@')[0]} eliminado por estar en *lista negra*.\n📝 Motivo: ${reason}`,
            mentions: [memberId]
          })
        } catch {}
      }
    } catch {}
  }

  // ✅ REMOVER DE LISTA NEGRA (por mención/cita o por índice)
  else if (command === 'remn') {
    if (!userJid || !dbUsers[userJid]?.banned)
      return conn.sendMessage(m.chat, { text: `${emoji} No está en lista negra.` })

    dbUsers[userJid].banned = false
    dbUsers[userJid].banReason = ''
    dbUsers[userJid].bannedBy = null

    await conn.sendMessage(m.chat, {
      text: `${ok} *Removido de LISTA NEGRA*\n${SEP}\n@${userJid.split('@')[0]} ya no está en la lista negra.`,
      mentions: [userJid]
    })
  }

  // ✅ LISTAR (numerada y vistosa)
  else if (command === 'listn') {
    if (bannedList.length === 0)
      return conn.sendMessage(m.chat, { text: `${ok} Lista negra vacía.` })

    let list = `🚫 *Lista negra — ${bannedList.length}*\n${SEP}\n`
    const mentions = []

    bannedList.forEach(([jid, data], i) => {
      const by = data.bannedBy ? ` (por @${(data.bannedBy||'').split('@')[0]})` : ''
      list += `*${i + 1}.* @${jid.split('@')[0]}${by}\n📝 ${data.banReason || 'No especificado'}\n\n`
      mentions.push(jid)
    })

    list += SEP
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
    await conn.sendMessage(m.chat, { text: `${ok} Lista negra vaciada.` })
  }

  if (global.db.write) await global.db.write()
}

// ================= AUTO-KICK SI HABLA + AVISO =================

handler.all = async function (m) {
  try {
    if (!m.isGroup || !m.sender) return

    const db = global.db.data.users
    const sender = normalizeJid(m.sender)

    if (sender && db[sender]?.banned) {
      const reason = db[sender].banReason || 'No especificado'

      await this.groupParticipantsUpdate(m.chat, [sender], 'remove')
      await sleep(700)

      await this.sendMessage(m.chat, {
        text: `🚫 *Eliminado por LISTA NEGRA*\n━━━━━━━━━━━━━━━━━━━━\n@${sender.split('@')[0]} fue eliminado por estar en *lista negra*.\n📝 Motivo: ${reason}\n━━━━━━━━━━━━━━━━━━━━`,
        mentions: [sender]
      })
    }
  } catch {}
}

// ================= AUTO-KICK AL ENTRAR + AVISO =================

handler.before = async function (m) {
  try {
    // messageStubType 27 = add, 31 = invite? (varía según librería) — mantenemos ambos
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
        await sleep(700)

        await conn.sendMessage(m.chat, {
          text: `🚫 *Expulsado automáticamente*\n━━━━━━━━━━━━━━━━━━━━\n@${u.split('@')[0]} fue eliminado automáticamente por estar en *lista negra*.\n📝 Motivo: ${reason}\n━━━━━━━━━━━━━━━━━━━━`,
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
