// 📂 plugins/propietario-listanegra.js — VERSIÓN PREMIUM FINAL 2025
// Lista negra global + expulsión inmediata + índice numérico + FIX auto-kick al unirse

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// Normalizar JID
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

  // Cita
  if (m.quoted) userJid = normalizeJid(m.quoted.sender || m.quoted.participant)

  // Mención
  else if (m.mentionedJid?.length) userJid = normalizeJid(m.mentionedJid[0])

  // Número manual (+598...)
  else if (text) {
    const num = extractPhoneNumber(text)
    if (num) userJid = normalizeJid(num)
  }

  // Remover por índice: "remn 1"
  if (!userJid && command === 'remn' && text) {
    const bannedList = Object.entries(dbUsers).filter(([_, d]) => d.banned)
    const index = parseInt(text.trim())
    if (!isNaN(index) && bannedList[index - 1]) {
      userJid = bannedList[index - 1][0]
    }
  }

  if (!userJid && !['listn', 'clrn'].includes(command)) {
    return conn.reply(m.chat, "⚠️ *Debes responder, mencionar o escribir un número.*", m)
  }

  if (userJid && !dbUsers[userJid]) dbUsers[userJid] = {}

  let reason = text?.replace(/@/g, '').replace(/\d{5,}/g, '').trim()
  if (!reason) reason = 'No especificado'

  // =============================
  // 🚫 AGREGAR
  // =============================
  if (command === 'addn') {
    dbUsers[userJid].banned = true
    dbUsers[userJid].banReason = reason
    dbUsers[userJid].bannedBy = m.sender

    await conn.sendMessage(m.chat, {
      text: `✨ *Usuario añadido a lista negra*\n\n🚫 *@${userJid.split('@')[0]}*\n📝 Motivo: ${reason}`,
      mentions: [userJid]
    })

    // Expulsión inmediata en el grupo actual
    if (m.isGroup) {
      try {
        await sleep(300)
        await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove')
        await sleep(200)
      } catch {}
    }

    // Auto-kick en TODOS los grupos
    const groups = Object.keys(await conn.groupFetchAllParticipating())
    for (const gid of groups) {
      await sleep(800)
      try {
        const meta = await conn.groupMetadata(gid)
        const found = meta.participants.find(p => normalizeJid(p.id) === userJid)
        if (!found) continue

        await conn.groupParticipantsUpdate(gid, [userJid], 'remove')
        await sleep(200)

        await conn.sendMessage(gid, {
          text: `🚫 *Miembro eliminado automáticamente*\n@${userJid.split('@')[0]} está en *lista negra*.\n📝 Motivo: ${reason}`,
          mentions: [userJid]
        })
      } catch {}
    }
  }

  // =============================
  // ♻️ REMOVER
  // =============================
  else if (command === 'remn') {
    if (!dbUsers[userJid]?.banned)
      return conn.sendMessage(m.chat, { text: "⚠️ Ese usuario no está en la lista negra." })

    dbUsers[userJid].banned = false
    dbUsers[userJid].banReason = ''
    dbUsers[userJid].bannedBy = null

    await conn.sendMessage(m.chat, {
      text: `✨ *Usuario removido de lista negra*\n\n🟢 *@${userJid.split('@')[0]}*\n✔️ Ya no será expulsado automáticamente.`,
      mentions: [userJid]
    })
  }

  // =============================
  // 📜 LISTA COMPLETA
  // =============================
  else if (command === 'listn') {
    const banned = Object.entries(dbUsers).filter(([_, d]) => d.banned)

    if (banned.length === 0)
      return conn.sendMessage(m.chat, { text: "🟢 No hay usuarios en la lista negra." })

    let msg = ""
    msg += "╔════════════════════╗\n"
    msg += "     🚫 *LISTA NEGRA GLOBAL* 🚫\n"
    msg += "╚════════════════════╝\n\n"

    const mentions = []

    banned.forEach(([jid, data], i) => {
      msg += `*${i + 1}. @${jid.split('@')[0]}*\n`
      msg += `   📝 Motivo: ${data.banReason}\n`
      msg += "   ────────────────────────\n"
      mentions.push(jid)
    })

    msg += `\n🔢 *Total:* ${banned.length}`

    await conn.sendMessage(m.chat, { text: msg.trim(), mentions })
  }

  // =============================
  // 🧹 LIMPIAR TODO
  // =============================
  else if (command === 'clrn') {
    for (const jid in dbUsers) {
      dbUsers[jid].banned = false
      dbUsers[jid].banReason = ''
      dbUsers[jid].bannedBy = null
    }

    await conn.sendMessage(m.chat, { text: "✨ Lista negra vaciada." })
  }

  if (global.db.write) await global.db.write()
}

// =============================
// 🚨 AUTO-KICK AL HABLAR
// =============================
handler.all = async function (m) {
  if (!m.isGroup || !m.sender) return
  const sender = normalizeJid(m.sender)
  const db = global.db.data.users

  if (db[sender]?.banned) {
    const reason = db[sender].banReason || 'No especificado'

    await this.groupParticipantsUpdate(m.chat, [sender], 'remove')
    await sleep(250)

    await this.sendMessage(m.chat, {
      text: `🚫 *@${sender.split('@')[0]}* fue eliminado por enviar un mensaje.\n📝 Motivo: ${reason}`,
      mentions: [sender]
    })
  }
}

// =============================
// 🚨 AUTO-KICK AL ENTRAR (FIX 2025)
// =============================
// Tipos reales: 28, 29, 32, 40
handler.before = async function (m) {
  const joinTypes = [28, 29, 32, 40]

  if (!joinTypes.includes(m.messageStubType)) return

  const db = global.db.data.users

  for (const user of (m.messageStubParameters || [])) {
    const jid = normalizeJid(user)
    if (!db[jid]?.banned) continue

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
