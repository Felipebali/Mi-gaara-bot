// 📂 plugins/propietario-listanegra.js — ULTRA FINAL 2025 SANO
// Lista negra global + auto-kick TOTAL + remn por índice + normalizeJid robusto

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ========================
// Normalización JID robusta
// ========================
function normalizeJid(jid = '') {
  if (!jid) return null
  jid = jid.toString().trim()
  if (jid.includes('@')) jid = jid.split('@')[0]
  jid = jid.replace(/[^0-9]/g, '')
  if (!jid) return null
  return jid + '@s.whatsapp.net'
}

function digitsOnly(t = '') { return t.toString().replace(/[^0-9]/g, '') }
function extractPhoneNumber(t = '') {
  const d = digitsOnly(t)
  return d && d.length >= 5 ? d : null
}

const handler = async (m, { conn, command, text }) => {
  const dbUsers = global.db.data.users || (global.db.data.users = {})

  let userJid = null
  let index = null

  // -------------------------
  // remn por índice
  // -------------------------
  if (command === 'remn' && text && !isNaN(text)) {
    const bannedList = Object.entries(dbUsers).filter(([_, d]) => d.banned)
    index = parseInt(text) - 1
    if (!bannedList[index])
      return conn.sendMessage(m.chat, { text: `⚠️ No existe usuario con ese número.` })
    userJid = bannedList[index][0]
  } else {
    if (m.quoted) userJid = normalizeJid(m.quoted.sender || m.quoted.participant)
    else if (m.mentionedJid?.length) userJid = normalizeJid(m.mentionedJid[0])
    else if (text) {
      const num = extractPhoneNumber(text)
      if (num) userJid = normalizeJid(num)
    }

    if (!userJid && !['listn', 'clrn'].includes(command))
      return conn.reply(m.chat, "⚠️ *Debes responder, mencionar, escribir un número o usar índice.*", m)
  }

  if (userJid && !dbUsers[userJid]) dbUsers[userJid] = {}

  let reason = text?.replace(/@/g, '')?.replace(/\d{5,}/g, '')?.trim()
  if (!reason) reason = 'No especificado'

  // ==========================================
  // 🚫 AÑADIR A LA LISTA NEGRA
  // ==========================================
  if (command === 'addn') {
    dbUsers[userJid].banned = true
    dbUsers[userJid].banReason = reason

    await conn.sendMessage(m.chat, {
      text: `🚫 *Usuario añadido a la lista negra*\n\n👤 *@${userJid.split('@')[0]}*\n📛 Motivo: ${reason}`,
      mentions: [userJid]
    })

    // Intento expulsión inmediata solo si está en este grupo
    if (m.isGroup) {
      try {
        await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove')
        await sleep(120)
        await conn.sendMessage(m.chat, {
          text: `🚫 *@${userJid.split('@')[0]}* fue expulsado inmediatamente.\n📛 Motivo: Lista negra.`,
          mentions: [userJid]
        })
      } catch {}
    }
  }

  // ==========================================
  // ♻️ Quitar de lista negra
  // ==========================================
  else if (command === 'remn') {
    if (!dbUsers[userJid]?.banned)
      return conn.sendMessage(m.chat, { text: "⚠️ *Ese usuario no está en la lista negra.*" })

    dbUsers[userJid].banned = false
    dbUsers[userJid].banReason = ''

    await conn.sendMessage(m.chat, {
      text: `🟢 *Usuario removido de la lista negra*\n\n👤 *@${userJid.split('@')[0]}*\n✔️ Ya no es peligroso.`,
      mentions: [userJid]
    })
  }

  // ==========================================
  // 📜 Mostrar lista negra
  // ==========================================
  else if (command === 'listn') {
    const banned = Object.entries(dbUsers).filter(([_, d]) => d.banned)
    if (!banned.length)
      return conn.sendMessage(m.chat, { text: "🟢 *No hay usuarios en la lista negra.*" })

    let msg = "🚫 *LISTA NEGRA GLOBAL*\n\n"
    const mentions = []
    for (let i = 0; i < banned.length; i++) {
      const [jid, data] = banned[i]
      msg += `${i + 1}. *@${jid.split('@')[0]}*\n   📛 Motivo: ${data.banReason}\n\n`
      mentions.push(jid)
    }

    await conn.sendMessage(m.chat, { text: msg.trim(), mentions })
  }

  // ==========================================
  // 🧹 Limpiar lista negra
  // ==========================================
  else if (command === 'clrn') {
    Object.keys(dbUsers).forEach(jid => {
      if (dbUsers[jid].banned) {
        dbUsers[jid].banned = false
        dbUsers[jid].banReason = ''
      }
    })

    await conn.sendMessage(m.chat, { text: "✨ *Lista negra vaciada.*" })
  }

  if (global.db.write) await global.db.write()
}

// =====================================================
// 🚨 AUTO-KICK AL HABLAR
// =====================================================
handler.all = async function (m) {
  if (!m.isGroup) return
  const db = global.db.data.users

  const sender = normalizeJid(m.sender || m.key?.participant)
  if (!sender) return
  if (!db[sender]?.banned) return

  try {
    const meta = await this.groupMetadata(m.chat)
    const inside = meta.participants.some(p => normalizeJid(p.id) === sender)
    if (!inside) return
  } catch { return }

  const reason = db[sender].banReason || 'No especificado'

  try {
    await this.groupParticipantsUpdate(m.chat, [sender], 'remove')
  } catch {}

  await sleep(120)

  await this.sendMessage(m.chat, {
    text: `🚫 *@${sender.split('@')[0]}* fue expulsado por hablar.\n📛 Motivo: ${reason}`,
    mentions: [sender]
  })
}

// =====================================================
// 🚨 AUTO-KICK AL ENTRAR **VERSIÓN SANA**
// Detecta nuevos miembros sin spamear ni duplicar expulsiones
// =====================================================
handler.before = async function (m) {
  if (!m.isGroup) return
  if (![27, 28, 29, 31, 32].includes(m.messageStubType)) return

  const db = global.db.data.users
  const gid = m.chat

  try {
    // antes
    const before = (await this.groupMetadata(gid)).participants.map(p => normalizeJid(p.id))
    await sleep(350)
    // después
    const after = (await this.groupMetadata(gid)).participants.map(p => normalizeJid(p.id))

    // nuevos
    const nuevos = after.filter(j => !before.includes(j))
    if (!nuevos.length) return

    for (const jid of nuevos) {
      if (!db[jid]?.banned) continue

      const reason = db[jid].banReason || 'No especificado'

      try {
        await this.groupParticipantsUpdate(gid, [jid], 'remove')
      } catch {}

      await sleep(120)

      await this.sendMessage(gid, {
        text: `🚫 *@${jid.split('@')[0]}* fue expulsado al entrar.\n📛 Motivo: ${reason}`,
        mentions: [jid]
      })
    }
  } catch {}
}

handler.help = ['addn', 'remn', 'clrn', 'listn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'clrn', 'listn']
handler.rowner = true

export default handler
