// 📂 plugins/propietario-re.js — FELI 2025 — GLOBAL RE 🔥

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function digitsOnly(t = '') {
  return (t || '').toString().replace(/[^0-9]/g, '')
}

function normalizeJid(num = '') {
  const d = digitsOnly(num)
  if (!d) return null
  return d + '@s.whatsapp.net'
}

function findParticipantByDigits(meta, digits) {
  return meta.participants.find(p => {
    const pd = digitsOnly(p.id)
    return pd === digits || pd.endsWith(digits)
  })
}

// =====================================================
// 🔥 AUTO-KICK CUANDO ENTRA (RE GLOBAL)
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

    if (db.reBlackList.some(u => u.digits === digits))
      return m.reply(`${emoji} Ese número ya está en la lista.`)

    const jid = normalizeJid(digits)

    db.reBlackList.push({
      digits,
      jid,
      by: m.sender,
      date: Date.now()
    })

    await m.reply(`${ok} *Agregado a lista negra*\n${SEP}\n📞 ${digits}\n${SEP}`)

    // ===== EXPULSIÓN GLOBAL INMEDIATA =====
    try {
      const groups = Object.keys(await conn.groupFetchAllParticipating())

      for (const gid of groups) {
        await sleep(900)
        try {
          const meta = await conn.groupMetadata(gid)
          const participant = findParticipantByDigits(meta, digits)
          if (!participant) continue

          await conn.groupParticipantsUpdate(gid, [participant.id], 'remove')
          await sleep(300)

          await conn.sendMessage(gid, {
            text: `${emoji} Usuario eliminado por *RE GLOBAL*\n📞 ${digits}`,
            mentions: [participant.id]
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
      `${ok} *Removido de lista negra*\n${SEP}\n📞 ${removed.digits}\n${SEP}`
    )
  }

  // ================= .vre =================
  else if (command === 'vre') {

    if (!db.reBlackList.length)
      return m.reply(`${ok} Lista negra vacía.`)

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
// 🚨 DETECTOR DE NUEVOS PARTICIPANTES
// =====================================================
handler.before = async function (m, { conn }) {

  if (!m.isGroup) return

  const db = global.db.data
  db.reBlackList = db.reBlackList || []

  // 27 = usuario agregado
  if (m.messageStubType !== 27) return

  const newUsers = m.messageStubParameters || []

  for (const jid of newUsers) {
    const digits = digitsOnly(jid)

    const banned = db.reBlackList.find(u =>
      u.digits === digits || digits.endsWith(u.digits)
    )

    if (!banned) continue

    try {
      await sleep(500)
      await conn.groupParticipantsUpdate(m.chat, [jid], 'remove')

      await conn.sendMessage(m.chat, {
        text: `🚫 *RE GLOBAL*\n📞 ${digits}\nExpulsión automática.`,
        mentions: [jid]
      })
    } catch {}
  }
}

// ================= CONFIG =================
handler.help = ['re', 're2', 'vre']
handler.tags = ['owner']
handler.command = ['re', 're2', 'vre']
handler.rowner = true

export default handler 
