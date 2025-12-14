// 📂 plugins/propietario-re.js — FELI 2025 — GLOBAL RE 🔥 FIXED

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function digitsOnly(t = '') {
  return (t || '').toString().replace(/[^0-9]/g, '')
}

function normalizeJid(jid = '') {
  if (!jid) return null
  jid = jid.toString()
  if (jid.includes('@')) return jid
  const d = digitsOnly(jid)
  return d ? d + '@s.whatsapp.net' : null
}

function jidDigits(jid = '') {
  return digitsOnly(jid.split('@')[0])
}

function isSameNumber(a, b) {
  return a === b || a.endsWith(b) || b.endsWith(a)
}

// =====================================================
// ================= HANDLER PRINCIPAL =================
// =====================================================

const handler = async (m, { conn, command, text }) => {

  const SEP = '━━━━━━━━━━━━━━━━━━━━'
  const emoji = '🚫'
  const ok = '✅'

  const db = global.db.data
  db.reBlackList = db.reBlackList || []

  // ================= .re =================
  if (command === 're') {

    const digits = digitsOnly(text)
    if (!digits || digits.length < 6)
      return m.reply(`${emoji} Usá: *.re 598xxxxxxx*`)

    if (db.reBlackList.some(u => isSameNumber(u.digits, digits)))
      return m.reply(`${emoji} Ese número ya está en la lista.`)

    db.reBlackList.push({
      digits,
      by: m.sender,
      date: Date.now()
    })

    await m.reply(
      `${ok} *Agregado a RE GLOBAL*\n${SEP}\n📞 ${digits}\n${SEP}`
    )

    // ===== EXPULSIÓN GLOBAL =====
    try {
      const groups = Object.keys(await conn.groupFetchAllParticipating())

      for (const gid of groups) {
        await sleep(800)
        try {
          const meta = await conn.groupMetadata(gid)

          const isBotAdmin = meta.participants.some(p =>
            p.id === conn.user.id && p.admin
          )
          if (!isBotAdmin) continue

          const target = meta.participants.find(p =>
            isSameNumber(jidDigits(p.id), digits)
          )
          if (!target) continue

          await conn.groupParticipantsUpdate(gid, [target.id], 'remove')

          await conn.sendMessage(gid, {
            text: `${emoji} *RE GLOBAL*\n📞 ${digits}`,
            mentions: [target.id]
          })
        } catch {}
      }
    } catch {}
  }

  // ================= .re2 =================
  else if (command === 're2') {

    const index = parseInt(text?.trim())
    if (isNaN(index) || index < 1 || index > db.reBlackList.length)
      return m.reply(`${emoji} Índice inválido.`)

    const removed = db.reBlackList.splice(index - 1, 1)[0]

    await m.reply(
      `${ok} *Removido de RE GLOBAL*\n${SEP}\n📞 ${removed.digits}\n${SEP}`
    )
  }

  // ================= .vre =================
  else if (command === 'vre') {

    if (!db.reBlackList.length)
      return m.reply(`${ok} Lista RE vacía.`)

    let txt = `🚫 *RE GLOBAL — ${db.reBlackList.length}*\n${SEP}\n`
    db.reBlackList.forEach((u, i) => {
      txt += `*${i + 1}.* 📞 ${u.digits}\n`
    })
    txt += SEP

    await m.reply(txt)
  }

  if (global.db.write) await global.db.write()
}

// =====================================================
// ========== AUTO-KICK AL ENTRAR (REAL) ================
// =====================================================

handler.before = async function (m, { conn }) {

  if (!m.isGroup) return
  if (![27, 28, 32].includes(m.messageStubType)) return

  const db = global.db.data
  db.reBlackList = db.reBlackList || []

  const newUsers = m.messageStubParameters || []
  if (!newUsers.length) return

  try {
    const meta = await conn.groupMetadata(m.chat)

    const isBotAdmin = meta.participants.some(p =>
      p.id === conn.user.id && p.admin
    )
    if (!isBotAdmin) return

    for (const jid of newUsers) {
      const digits = jidDigits(jid)

      const banned = db.reBlackList.find(u =>
        isSameNumber(u.digits, digits)
      )
      if (!banned) continue

      await sleep(400)
      await conn.groupParticipantsUpdate(m.chat, [jid], 'remove')

      await conn.sendMessage(m.chat, {
        text: `🚫 *RE GLOBAL*\n📞 ${digits}\nExpulsión automática.`,
        mentions: [jid]
      })
    }
  } catch {}
}

// ================= CONFIG =================

handler.help = ['re', 're2', 'vre']
handler.tags = ['owner']
handler.command = ['re', 're2', 'vre']
handler.rowner = true

export default handler
