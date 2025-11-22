// 📂 plugins/propietario-listanegra.js — Versión con mejoras de robustez

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function normalizeJid(jid = '') {
  if (!jid) return null
  jid = jid.toString().trim()
  jid = jid.replace(/^\+/, '')
  if (jid.endsWith('@c.us') || jid.endsWith('@s.whatsapp.net')) return jid.replace(/@c\.us$/, '@s.whatsapp.net')
  if (jid.includes('@')) return jid
  return jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
}

function digitsOnly(text = '') { return (text || '').toString().replace(/[^0-9]/g, '') }

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

  const dbUsers = global.db && global.db.data && global.db.data.users
    ? global.db.data.users
    : (global.db.data.users = {})

  const reactions = { addn: '✅', remn: '☢️', clrn: '🧹', listn: '📜', seen: '👀' }
  if (reactions[command]) await conn.sendMessage(m.chat, { react: { text: reactions[command], key: m.key } })

  // detectar usuario / número
  let userJid = null
  let numberDigits = null

  if (m.quoted) {
    userJid = normalizeJid(m.quoted.sender || m.quoted.participant || '')
  } else if (m.mentionedJid && m.mentionedJid.length) {
    userJid = normalizeJid(m.mentionedJid[0])
  } else if (text) {
    const num = extractPhoneNumber(text)
    if (num) {
      numberDigits = num
      userJid = normalizeJid(num + '@s.whatsapp.net')
    }
  }

  let reason = text ? text.replace(/@/g, '').replace(/\d{5,}/g, '').trim() : 'No especificado'
  if (!reason) reason = 'No especificado'

  if (!userJid && !['listn', 'clrn', 'seen'].includes(command)) {
    return conn.reply(m.chat, `${emoji} Debes responder, mencionar o escribir el número del usuario.`, m)
  }

  // guardamos tanto por JID como por clave numérica 'd:<digits>' para buscar por cualquiera
  const keyJid = userJid
  const keyDigits = numberDigits || (userJid ? digitsOnly(userJid) : null)

  if (keyJid && !dbUsers[keyJid]) dbUsers[keyJid] = {}
  if (keyDigits && !dbUsers['d:' + keyDigits]) dbUsers['d:' + keyDigits] = dbUsers[keyJid] || {}

  // --- ADD ---
  if (command === 'addn') {
    if (!keyJid && !keyDigits) return conn.reply(m.chat, `${emoji} No se pudo extraer el número o JID.`, m)

    const entry = dbUsers[keyJid] || dbUsers['d:' + keyDigits] || {}
    entry.banned = true
    entry.banReason = reason
    entry.bannedBy = m.sender
    // asegurar en ambas claves
    if (keyJid) dbUsers[keyJid] = entry
    if (keyDigits) dbUsers['d:' + keyDigits] = entry

    await conn.sendMessage(m.chat, {
      text: `${done} ${keyJid ? '@' + keyJid.split('@')[0] : ('número ' + keyDigits)} fue agregado a la lista negra.\n\n📝 Motivo: ${reason}`,
      mentions: keyJid ? [keyJid] : []
    })

    // intentar expulsar donde esté (limitar)
    let groupsObj = {}
    try { groupsObj = await conn.groupFetchAllParticipating() } catch (e) { console.log('⚠️ No se pudo obtener grupos:', e); groupsObj = {} }
    const groups = Object.keys(groupsObj || {}).slice(0, 80)

    for (const jid of groups) {
      await sleep(2000)
      try {
        const group = await conn.groupMetadata(jid)
        let member = null
        if (keyJid) member = group.participants.find(p => normalizeJid(p.id || p) === normalizeJid(keyJid))
        if (!member && keyDigits) member = findMemberByNumber(group, keyDigits)
        if (member) {
          const memberId = member.id || member

          // comprobar si el bot es admin en ese grupo
          const botId = (conn.user && conn.user.id) ? (conn.user.id.split(':')[0] + '@s.whatsapp.net') : null
          const botPart = group.participants.find(p => (p.id || p) === botId || normalizeJid(p.id || p) === normalizeJid(botId))
          const botIsAdmin = botPart && (botPart.admin === 'admin' || botPart.admin === 'superadmin' || botPart.admin === true)

          if (!botIsAdmin) {
            console.log(`⚠️ No soy admin en ${jid}, no puedo expulsar a ${memberId}`)
            // informar al chat donde ejecutaste el comando (solo la primera vez)
            await conn.sendMessage(m.chat, { text: `⚠️ No soy admin en el grupo "${group.subject || jid}". No pude expulsar automáticamente a @${memberId.split('@')[0]}.`, mentions: [memberId] })
            continue
          }

          await conn.groupParticipantsUpdate(jid, [memberId], 'remove')
          await sleep(1200)

          await conn.sendMessage(jid, {
            text: `🚫 @${memberId.split('@')[0]} fue eliminado automáticamente por estar en la lista negra.\n\n📝 Motivo: ${reason}`,
            mentions: [memberId]
          })

          console.log(`[AUTO-KICK] Expulsado ${memberId} de ${group.subject || jid}`)
        }
      } catch (e) {
        const em = e?.message || String(e)
        if (em.includes('rate') || em.includes('429')) {
          console.log(`⚠️ Rate limit en ${jid}, pausando 10s...`)
          await sleep(10000)
          continue
        }
        console.log(`⚠️ No se pudo expulsar de ${jid}: ${em}`)
      }
    }
  }

  // --- REM ---
  else if (command === 'remn') {
    if (!keyJid && !keyDigits) return conn.sendMessage(m.chat, { text: `${emoji} No se encontró el usuario en la lista.`, mentions: [] })
    const entry = (keyJid && dbUsers[keyJid]) || (keyDigits && dbUsers['d:' + keyDigits])
    if (!entry || !entry.banned) return conn.sendMessage(m.chat, { text: `${emoji} No está en la lista negra.`, mentions: keyJid ? [keyJid] : [] })

    entry.banned = false
    entry.banReason = ''
    entry.bannedBy = null
    if (keyJid) dbUsers[keyJid] = entry
    if (keyDigits) dbUsers['d:' + keyDigits] = entry

    await conn.sendMessage(m.chat, { text: `${done} Eliminado de la lista negra.`, mentions: keyJid ? [keyJid] : [] })
  }

  // --- SEEN ---
  else if (command === 'seen') {
    if (!keyJid && !keyDigits) return conn.sendMessage(m.chat, { text: `${emoji} No se pudo obtener usuario.`, mentions: [] })
    const entry = (keyJid && dbUsers[keyJid]) || (keyDigits && dbUsers['d:' + keyDigits])
    if (!entry || !entry.banned) return conn.sendMessage(m.chat, { text: `✅ No está en la lista negra.`, mentions: keyJid ? [keyJid] : [] })
    await conn.sendMessage(m.chat, {
      text: `${emoji} ${keyJid ? '@' + keyJid.split('@')[0] : ('número ' + keyDigits)} está en la lista negra.\n\n📝 Motivo: ${entry.banReason || 'No especificado'}`,
      mentions: keyJid ? [keyJid] : []
    })
  }

  // --- LIST ---
  else if (command === 'listn') {
    const bannedUsers = Object.entries(dbUsers).filter(([k, v]) => v?.banned && !k.startsWith('d:'))
    if (bannedUsers.length === 0) return conn.sendMessage(m.chat, { text: `${done} No hay usuarios en la lista negra.` })
    let list = '🚫 *Lista negra actual:*\n\n'
    const mentions = []
    for (const [jid, data] of bannedUsers) {
      list += `• @${jid.split('@')[0]}\n  Motivo: ${data.banReason || 'No especificado'}\n\n`
      mentions.push(jid)
    }
    await conn.sendMessage(m.chat, { text: list.trim(), mentions })
  }

  // --- CLR ---
  else if (command === 'clrn') {
    for (const k in dbUsers) {
      if (dbUsers[k]?.banned) { dbUsers[k].banned = false; dbUsers[k].banReason = ''; dbUsers[k].bannedBy = null }
    }
    await conn.sendMessage(m.chat, { text: `${done} La lista negra ha sido vaciada.` })
  }

  if (global.db?.write) await global.db.write()
}

// AUTO-KICK cuando habla alguien
handler.all = async function (m) {
  try {
    if (!m.isGroup || !m.sender) return
    const conn = this
    const db = global.db?.data?.users || {}
    const senderJid = normalizeJid(m.sender)
    const senderDigits = digitsOnly(senderJid)
    // buscar por JID o por clave numerica 'd:<digits>'
    const entry = db[senderJid] || db['d:' + senderDigits]

    if (entry?.banned) {
      const reason = entry.banReason || 'No especificado'
      try {
        // verificar si el bot es admin en este grupo
        const group = await conn.groupMetadata(m.chat)
        const botId = (conn.user && conn.user.id) ? (conn.user.id.split(':')[0] + '@s.whatsapp.net') : null
        const botPart = group.participants.find(p => (p.id || p) === botId || normalizeJid(p.id || p) === normalizeJid(botId))
        const botIsAdmin = botPart && (botPart.admin === 'admin' || botPart.admin === 'superadmin' || botPart.admin === true)

        if (!botIsAdmin) {
          console.log(`⚠️ No soy admin en ${m.chat}, no puedo expulsar a ${senderJid}`)
          // avisar al grupo (opcional)
          await conn.sendMessage(m.chat, { text: `⚠️ No soy admin, no puedo expulsar a @${senderJid.split('@')[0]}.`, mentions: [senderJid] })
          return
        }

        await conn.groupParticipantsUpdate(m.chat, [senderJid], 'remove')
        await sleep(1000)
        await conn.sendMessage(m.chat, {
          text: `🚫 @${senderJid.split('@')[0]} fue eliminado por estar en la lista negra.\n📝 Motivo: ${reason}`,
          mentions: [senderJid]
        })
        console.log(`[AUTO-KICK] Eliminado ${senderJid}`)
      } catch (e) {
        const em = e?.message || ''
        if (em.includes('rate') || em.includes('429')) {
          console.log('⚠️ Rate limit al intentar autokick. Esperando 10s...')
          await sleep(10000)
        } else console.log(`⚠️ No se pudo eliminar a ${senderJid}: ${em}`)
      }
    }
  } catch (e) {
    console.log('Error en handler.all de lista negra:', e)
  }
}

// AUTO-KICK al unirse/invitar
handler.participantsUpdate = async function (event) {
  try {
    const conn = this
    const { id, participants, action } = event
    if (action !== 'add' && action !== 'invite') return
    const db = global.db?.data?.users || {}
    const group = await conn.groupMetadata(id)
    const botId = (conn.user && conn.user.id) ? (conn.user.id.split(':')[0] + '@s.whatsapp.net') : null
    const botPart = group.participants.find(p => (p.id || p) === botId || normalizeJid(p.id || p) === normalizeJid(botId))
    const botIsAdmin = botPart && (botPart.admin === 'admin' || botPart.admin === 'superadmin' || botPart.admin === true)

    for (const user of participants) {
      const u = normalizeJid(user)
      const ud = digitsOnly(u)
      const entry = db[u] || db['d:' + ud]
      if (entry?.banned) {
        const reason = entry.banReason || 'No especificado'
        try {
          if (!botIsAdmin) {
            console.log(`⚠️ No soy admin en ${id}, no puedo expulsar a ${u}`)
            await conn.sendMessage(id, { text: `⚠️ No soy admin, no puedo expulsar a @${u.split('@')[0]}.`, mentions: [u] })
            continue
          }
          await conn.groupParticipantsUpdate(id, [u], 'remove')
          await sleep(1000)
          await conn.sendMessage(id, {
            text: `🚫 @${u.split('@')[0]} fue eliminado automáticamente por estar en la lista negra.\n📝 Motivo: ${reason}`,
            mentions: [u]
          })
          console.log(`[AUTO-KICK JOIN] ${u} eliminado`)
        } catch (e) {
          const em = e?.message || ''
          if (em.includes('rate') || em.includes('429')) {
            console.log('⚠️ Rate limit al expulsar al unirse. Esperando 10s...')
            await sleep(10000)
          } else console.log(`⚠️ No se pudo eliminar a ${u}: ${em}`)
        }
      }
    }
  } catch (e) {
    console.log('Error en participantsUpdate de lista negra:', e)
  }
}

handler.help = ['addn', 'remn', 'clrn', 'listn', 'seen']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'clrn', 'listn', 'seen']
handler.rowner = true

export default handler
