// 📂 plugins/propietario-listanegra.js — ULTRA FINAL 2025 FIX +598 (FORZADO)
// Lista negra global + auto-kick TOTAL + avisos limpios (solo usuario y motivo)

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// normalizeJid robusto: acepta +598, whatsapp:+598..., jid completo, etc.
function normalizeJid(jid = '') {
  if (!jid) return null
  jid = jid.toString().trim()
  // si ya contiene @, intentar extraer sólo la parte numérica antes del @
  if (jid.includes('@')) jid = jid.split('@')[0]
  // quitar prefijos no numéricos (whatsapp:, +, espacios, paréntesis, guiones)
  jid = jid.replace(/[^0-9]/g, '')
  if (!jid) return null
  return jid + '@s.whatsapp.net'
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

  // REMN por índice en la lista
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

  // =======================
  // 🚫 AÑADIR A LISTA NEGRA (FORZADO: expulsa incluso si agregaron por +598)
  // =======================
  if (command === 'addn') {
    dbUsers[userJid].banned = true
    dbUsers[userJid].banReason = reason

    // Aviso en chat actual
    await conn.sendMessage(m.chat, {
      text: `🚫 *Usuario añadido a la lista negra*\n\n👤 *@${userJid.split('@')[0]}*\n📛 Motivo: ${reason}`,
      mentions: [userJid]
    })

    // 1) Intento expulsar directamente del grupo actual (si aplica)
    if (m.isGroup) {
      try {
        await sleep(150)
        await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove')
        await sleep(120)
        await conn.sendMessage(m.chat, {
          text: `🚫 *@${userJid.split('@')[0]}* fue expulsado inmediatamente.\n📛 Motivo: Lista negra.`,
          mentions: [userJid]
        })
      } catch {
        // Si falla, intentamos con metadata+verificación (por latencia en actualización)
        try {
          const meta = await conn.groupMetadata(m.chat)
          const inside = meta.participants.some(p => normalizeJid(p.id) === userJid)
          if (inside) {
            await sleep(200)
            await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove')
            await sleep(120)
            await conn.sendMessage(m.chat, {
              text: `🚫 *@${userJid.split('@')[0]}* fue expulsado inmediatamente.\n📛 Motivo: Lista negra.`,
              mentions: [userJid]
            })
          }
        } catch {}
      }
    }

    // 2) Barrido global: intento forzado en todos los grupos donde esté el bot
    try {
      const groupsObj = await conn.groupFetchAllParticipating()
      const groups = Object.keys(groupsObj || {})
      for (const gid of groups) {
        try {
          // intento directo (no dependemos de que metadata esté perfecta)
          await conn.groupParticipantsUpdate(gid, [userJid], 'remove')
          await sleep(120)
          await conn.sendMessage(gid, {
            text: `🚫 *Expulsado automáticamente por lista negra*\n\n👤 @${userJid.split('@')[0]}\n📛 Motivo: ${reason}`,
            mentions: [userJid]
          })
        } catch {
          // si el intento directo falla (no estaba), comprobamos metadata para evitar ruido
          try {
            const meta = await conn.groupMetadata(gid)
            const inside = meta.participants.some(p => normalizeJid(p.id) === userJid)
            if (!inside) continue
            await sleep(120)
            await conn.groupParticipantsUpdate(gid, [userJid], 'remove')
            await sleep(100)
            await conn.sendMessage(gid, {
              text: `🚫 *Expulsado automáticamente por lista negra*\n\n👤 @${userJid.split('@')[0]}\n📛 Motivo: ${reason}`,
              mentions: [userJid]
            })
          } catch {}
        }
      }
    } catch {}
  }

  // =======================
  // ♻️ REMOVER DE LISTA NEGRA
  // =======================
  else if (command === 'remn') {
    if (!dbUsers[userJid]?.banned)
      return conn.sendMessage(m.chat, { text: "⚠️ *Ese usuario no está en la lista negra.*" })

    dbUsers[userJid].banned = false
    dbUsers[userJid].banReason = ''

    await conn.sendMessage(m.chat, {
      text: `🟢 *Usuario removido de la lista negra*\n\n👤 *@${userJid.split('@')[0]}*\n✔️ Ya no es considerado peligroso.`,
      mentions: [userJid]
    })
  }

  // =======================
  // 📜 LISTA NEGRA
  // =======================
  else if (command === 'listn') {
    const banned = Object.entries(dbUsers).filter(([_, d]) => d.banned)
    if (banned.length === 0)
      return conn.sendMessage(m.chat, { text: "🟢 *No hay usuarios en la lista negra.*" })

    let msg = "🚫 *LISTA NEGRA GLOBAL*\n\n"
    const mentions = []

    banned.forEach(([jid, data], i) => {
      msg += `${i + 1}. *@${jid.split('@')[0]}*\n   📛 Motivo: ${data.banReason}\n\n`
      mentions.push(jid)
    })

    conn.sendMessage(m.chat, { text: msg.trim(), mentions })
  }

  // =======================
  // 🧹 LIMPIAR LISTA
  // =======================
  else if (command === 'clrn') {
    for (const jid in dbUsers) {
      if (dbUsers[jid].banned) {
        dbUsers[jid].banned = false
        dbUsers[jid].banReason = ''
      }
    }
    conn.sendMessage(m.chat, { text: "✨ *Lista negra vaciada completamente.*" })
  }

  if (global.db.write) await global.db.write()
}

// ========================
// 🚨 AUTO-KICK AL HABLAR
// ========================
handler.all = async function (m) {
  if (!m.isGroup) return
  const db = global.db.data.users
  const sender = normalizeJid(m.sender || m.key?.participant)
  if (!sender) return
  if (!db[sender]?.banned) return

  try {
    const meta = await this.groupMetadata(m.chat)
    const inGroup = meta.participants.some(p => normalizeJid(p.id) === sender)
    if (!inGroup) return
  } catch { return }

  const reason = db[sender].banReason || 'No especificado'
  try {
    await this.groupParticipantsUpdate(m.chat, [sender], 'remove')
  } catch {}
  await sleep(150)
  await this.sendMessage(m.chat, {
    text: `🚫 *@${sender.split('@')[0]}* fue expulsado por enviar un mensaje.\n📛 Motivo: ${reason}`,
    mentions: [sender]
  })
}

// ================================
// 🚨 AUTO-KICK AL ENTRAR / AGREGAR (MEJORADO)
// ================================
handler.before = async function (m) {
  if (![27, 31, 32].includes(m.messageStubType)) return

  const db = global.db.data.users

  try {
    // intentamos procesar parámetros si existen
    if (Array.isArray(m.messageStubParameters) && m.messageStubParameters.length) {
      for (const user of m.messageStubParameters) {
        const jid = normalizeJid(user)
        if (!db[jid]?.banned) continue
        try {
          await this.groupParticipantsUpdate(m.chat, [jid], 'remove')
        } catch {}
        await sleep(120)
        await this.sendMessage(m.chat, {
          text: `🚫 *@${jid.split('@')[0]}* fue expulsado al unirse/ser agregado.\n📛 Motivo: ${db[jid].banReason || 'No especificado'}`,
          mentions: [jid]
        })
      }
    }

    // ESCANEAR participantes actuales (detecta agregados por número +598)
    const meta = await this.groupMetadata(m.chat)
    const participants = (meta.participants || []).map(p => normalizeJid(p.id))

    for (const jid of participants) {
      if (!db[jid]?.banned) continue
      try {
        await this.groupParticipantsUpdate(m.chat, [jid], 'remove')
      } catch {}
      await sleep(120)
      await this.sendMessage(m.chat, {
        text: `🚫 *@${jid.split('@')[0]}* fue expulsado automáticamente.\n📛 Motivo: ${db[jid].banReason || 'No especificado'}`,
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
