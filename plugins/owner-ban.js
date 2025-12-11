// 📂 plugins/propietario-listanegra.js — VERSIÓN PREMIUM ULTRA ESTABLE CORREGIDA
// Lista negra global numerada + auto-kick al hablar + remn por índice + no aviso si no está en el grupo

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function normalizeJid(jid = '') {
  if (!jid) return null
  jid = jid.toString().trim().replace(/^\+/, '')
  if (jid.endsWith('@c.us') || jid.endsWith('@s.whatsapp.net'))
    return jid.replace(/@c.us$/, '@s.whatsapp.net')
  if (jid.includes('@')) return jid
  return jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
}

function digitsOnly(t = '') { return t.toString().replace(/[^0-9]/g, '') }

function extractPhoneNumber(t = '') {
  const d = digitsOnly(t)
  if (!d || d.length < 5) return null
  return d
}

const handler = async (m, { conn, command, text }) => {
  const dbUsers = global.db.data.users || (global.db.data.users = {})

  let userJid = null
  let index = null

  // REMN por número de lista
  if (command === 'remn' && text && !isNaN(text)) {
    const bannedList = Object.entries(dbUsers).filter(([_, d]) => d.banned)
    index = parseInt(text) - 1
    if (!bannedList[index])
      return conn.sendMessage(m.chat, { text: `⚠️ No existe usuario con ese número.` })
    userJid = bannedList[index][0]
  } else {
    if (m.quoted)
      userJid = normalizeJid(m.quoted.sender || m.quoted.participant)
    else if (m.mentionedJid?.length)
      userJid = normalizeJid(m.mentionedJid[0])
    else if (text) {
      const num = extractPhoneNumber(text)
      if (num) userJid = normalizeJid(num)
    }

    if (!userJid && !['listn', 'clrn'].includes(command))
      return conn.reply(m.chat, "⚠️ *Debes responder, mencionar, escribir un número o usar índice.*", m)
  }

  if (userJid && !dbUsers[userJid]) dbUsers[userJid] = {}

  let reason = text?.replace(/@/g, '').replace(/\d{5,}/g, '').trim()
  if (!reason) reason = 'No especificado'

  // =============================
  // 🚫 AGREGAR A LISTA NEGRA
  // =============================
  if (command === 'addn') {
    dbUsers[userJid].banned = true
    dbUsers[userJid].banReason = reason
    dbUsers[userJid].bannedBy = m.sender

    await conn.sendMessage(m.chat, {
      text: `✨ *Usuario añadido a lista negra*\n\n🚫 *@${userJid.split('@')[0]}*\n📝 *Motivo:* ${reason}`,
      mentions: [userJid]
    })

    // Expulsión inmediata en grupo actual si está
    if (m.isGroup) {
      try {
        const meta = await conn.groupMetadata(m.chat)
        const participant = meta.participants.find(p => normalizeJid(p.id) === userJid)
        if (participant) {
          await sleep(300)
          await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove')
          await sleep(200)
          await conn.sendMessage(m.chat, {
            text: `🚫 *@${userJid.split('@')[0]}* fue eliminado inmediatamente.\n📛 *Razón:* Lista negra.`,
            mentions: [userJid]
          })
        }
      } catch {}
    }

    // Expulsión en todos los grupos
    const groups = Object.keys(await conn.groupFetchAllParticipating())
    for (const gid of groups) {
      await sleep(800)
      try {
        const meta = await conn.groupMetadata(gid)
        const participant = meta.participants.find(p => normalizeJid(p.id) === userJid)
        if (!participant) continue
        await conn.groupParticipantsUpdate(gid, [userJid], 'remove')
        await sleep(200)
        await conn.sendMessage(gid, {
          text: `🚫 *Miembro eliminado automáticamente*\n\n@${userJid.split('@')[0]} está en *lista negra*.\n📝 Motivo: ${reason}`,
          mentions: [userJid]
        })
      } catch {}
    }
  }

  // =============================
  // ♻️ REMOVER DE LISTA NEGRA
  // =============================
  else if (command === 'remn') {
    if (!dbUsers[userJid]?.banned)
      return conn.sendMessage(m.chat, { text: "⚠️ *Ese usuario no está en la lista negra.*" })

    dbUsers[userJid].banned = false
    dbUsers[userJid].banReason = ''
    dbUsers[userJid].bannedBy = null

    await conn.sendMessage(m.chat, {
      text: `✨ *Usuario removido de lista negra*\n\n🟢 *@${userJid.split('@')[0]}*\n✔️ Ya no será expulsado automáticamente.`,
      mentions: [userJid]
    })
  }

  // =============================
  // 📜 LISTA COMPLETA NUMERADA
  // =============================
  else if (command === 'listn') {
    const banned = Object.entries(dbUsers).filter(([_, d]) => d.banned)
    if (banned.length === 0)
      return conn.sendMessage(m.chat, { text: "🟢 *No hay usuarios en la lista negra.*" })

    let msg = "🚫 *Lista negra global:*\n\n"
    const mentions = []

    banned.forEach(([jid, data], i) => {
      msg += `${i + 1}. *@${jid.split('@')[0]}*\n   📝 Motivo: ${data.banReason}\n\n`
      mentions.push(jid)
    })

    await conn.sendMessage(m.chat, { text: msg.trim(), mentions })
  }

  // =============================
  // 🧹 LIMPIAR TODO
  // =============================
  else if (command === 'clrn') {
    for (const jid in dbUsers) {
      if (dbUsers[jid].banned) {
        dbUsers[jid].banned = false
        dbUsers[jid].banReason = ''
        dbUsers[jid].bannedBy = null
      }
    }
    await conn.sendMessage(m.chat, {
      text: "✨ *Lista negra completamente vaciada.*"
    })
  }

  if (global.db.write) await global.db.write()
}

// =============================
// 🚨 AUTO-KICK CUANDO HABLA
// =============================
handler.all = async function (m) {
  if (!m.isGroup) return
  const db = global.db.data.users

  // Obtener JID real del mensaje
  const sender = normalizeJid(m.sender || m.key?.participant)
  if (!sender) return
  if (!db[sender]?.banned) return

  // Revisar si realmente está en el grupo
  let inGroup = false
  try {
    const meta = await this.groupMetadata(m.chat)
    inGroup = meta.participants.some(p => normalizeJid(p.id) === sender)
  } catch { return }

  if (!inGroup) return

  const reason = db[sender].banReason || 'No especificado'
  await this.groupParticipantsUpdate(m.chat, [sender], 'remove')
  await sleep(250)
  await this.sendMessage(m.chat, {
    text: `🚫 *@${sender.split('@')[0]}* fue eliminado por enviar un mensaje.\n📝 Motivo: ${reason}`,
    mentions: [sender]
  })
}

// =============================
// 🚨 AUTO-KICK CUANDO ENTRA
// =============================
handler.before = async function (m) {
  if (![27, 31].includes(m.messageStubType)) return
  const db = global.db.data.users
  for (const user of m.messageStubParameters || []) {
    const jid = normalizeJid(user)
    if (!db[jid]?.banned) continue

    // Revisar si realmente está en el grupo
    let inGroup = false
    try {
      const meta = await this.groupMetadata(m.chat)
      inGroup = meta.participants.some(p => normalizeJid(p.id) === jid)
    } catch { continue }

    if (!inGroup) continue

    const reason = db[jid].banReason || 'No especificado'
    await sleep(400)
    await this.groupParticipantsUpdate(m.chat, [jid], 'remove')
    await sleep(200)
    await this.sendMessage(m.chat, {
      text: `🚫 *@${jid.split('@')[0]}* fue eliminado al unirse.\n📝 Motivo: ${reason}`,
      mentions: [jid]
    })
  }
}

handler.help = ['addn', 'remn', 'clrn', 'listn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'clrn', 'listn']
handler.rowner = true

export default handler
