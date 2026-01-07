// 📂 plugins/propietario-listanegra.js — FINAL DEFINITIVO REAL
// (NUM LISTA + AUTOKICK GLOBAL + AVISO SI HABLA + AVISO SI ENTRA + AUTO-KICK POR CITA)

import fs from 'fs'
import path from 'path'

// ================= BLACKLIST.JSON =================

const DATABASE_DIR = './database'
const BLACKLIST_FILE = path.join(DATABASE_DIR, 'blacklist.json')

if (!fs.existsSync(DATABASE_DIR))
  fs.mkdirSync(DATABASE_DIR, { recursive: true })

if (!fs.existsSync(BLACKLIST_FILE))
  fs.writeFileSync(BLACKLIST_FILE, JSON.stringify({}, null, 2))

function readBlacklist() {
  try {
    return JSON.parse(fs.readFileSync(BLACKLIST_FILE))
  } catch {
    return {}
  }
}

function writeBlacklist(data) {
  fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(data, null, 2))
}

// ================= UTILIDADES =================

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function normalizeJid(jid = '') {
  if (!jid) return null
  jid = jid.toString().trim().replace(/^\+/, '')
  if (jid.endsWith('@c.us') || jid.endsWith('@s.whatsapp.net'))
    return jid.replace(/@c.us$/, '@s.whatsapp.net')
  if (jid.includes('@')) return jid
  return jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
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
    if (pd === numberDigits || pd.endsWith(numberDigits) || numberDigits.endsWith(pd)) return p.id || p
    if (pd.includes(numberDigits) || numberDigits.includes(pd)) return p.id || p
  }
  return null
}

// ================= HANDLER PRINCIPAL =================

const handler = async (m, { conn, command, text }) => {
  const emoji = '🚫'
  const done = '✅'
  const dbUsers = readBlacklist()

  // AUTO-KICK POR CITA
  if (m.isGroup && m.quoted) {
    const quotedJid = normalizeJid(m.quoted.sender || m.quoted.participant)
    if (dbUsers[quotedJid]?.banned) {
      try {
        const reason = dbUsers[quotedJid].banReason || 'No especificado'
        await conn.groupParticipantsUpdate(m.chat, [quotedJid], 'remove')
        await sleep(800)
        await conn.sendMessage(m.chat, {
          text: `🚫 @${quotedJid.split('@')[0]} fue eliminado inmediatamente por estar en *lista negra*.\n📝 Motivo: ${reason}`,
          mentions: [quotedJid]
        })
        return
      } catch {}
    }
  }

  const reactions = { ln: '✅', unln: '☢️', clrn: '🧹', vln: '📜' }
  if (reactions[command])
    await conn.sendMessage(m.chat, { react: { text: reactions[command], key: m.key } })

  const bannedList = Object.entries(dbUsers).filter(([_, data]) => data.banned)

  let userJid = null
  let numberDigits = null

  if (command === 'unln' && /^\d+$/.test(text?.trim())) {
    const index = parseInt(text.trim()) - 1
    if (!bannedList[index])
      return conn.reply(m.chat, `${emoji} Número inválido en la lista.`, m)
    userJid = bannedList[index][0]
  }
  else if (m.quoted) userJid = normalizeJid(m.quoted.sender || m.quoted.participant)
  else if (m.mentionedJid?.length) userJid = normalizeJid(m.mentionedJid[0])
  else if (text) {
    const num = extractPhoneNumber(text)
    if (num) { numberDigits = num; userJid = normalizeJid(num) }
  }

  let reason = text?.replace(/@/g, '').replace(/\d{5,}/g, '').trim()
  if (!reason) reason = 'No especificado'

  if (!userJid && !['vln', 'clrn'].includes(command))
    return conn.reply(m.chat, `${emoji} Debes responder, mencionar, escribir número o usar número de lista.`, m)

  if (userJid && !dbUsers[userJid]) dbUsers[userJid] = {}

  if (command === 'ln') {
    dbUsers[userJid] = { banned: true, banReason: reason, bannedBy: m.sender }

    let groupsObj = await conn.groupFetchAllParticipating()
    for (const jid of Object.keys(groupsObj)) {
      try {
        const group = await conn.groupMetadata(jid)
        let member = group.participants.find(p => normalizeJid(p.id) === userJid)
        if (!member && numberDigits) member = findMemberByNumber(group, numberDigits)
        if (!member) continue

        const memberId = member.id || member
        await conn.groupParticipantsUpdate(jid, [memberId], 'remove')
        await sleep(800)

        await conn.sendMessage(jid, {
          text: `🚫 @${memberId.split('@')[0]} eliminado por estar en *lista negra*.\n📝 Motivo: ${reason}`,
          mentions: [memberId]
        })
      } catch {}
    }
  }

  else if (command === 'unln') {
    if (!dbUsers[userJid]?.banned)
      return conn.sendMessage(m.chat, { text: `${emoji} No está en lista negra.` })

    dbUsers[userJid] = { banned: false }
    await conn.sendMessage(m.chat, {
      text: `${done} @${userJid.split('@')[0]} eliminado de la lista negra.`,
      mentions: [userJid]
    })
  }

  else if (command === 'vln') {
    if (!bannedList.length)
      return conn.sendMessage(m.chat, { text: `${done} Lista negra vacía.` })

    let list = '🚫 *Lista negra:*\n\n'
    const mentions = []
    bannedList.forEach(([jid, data], i) => {
      list += `*${i + 1}.* @${jid.split('@')[0]}\nMotivo: ${data.banReason}\n\n`
      mentions.push(jid)
    })
    await conn.sendMessage(m.chat, { text: list.trim(), mentions })
  }

  else if (command === 'clrn') {
    for (const jid in dbUsers) dbUsers[jid].banned = false
    await conn.sendMessage(m.chat, { text: `${done} Lista negra vaciada.` })
  }

  writeBlacklist(dbUsers)
}

// ================= AUTO-KICK SI HABLA =================

handler.all = async function (m) {
  try {
    if (!m.isGroup || !m.sender) return
    const db = readBlacklist()
    const sender = normalizeJid(m.sender)

    if (db[sender]?.banned) {
      const reason = db[sender].banReason || 'No especificado'
      await this.groupParticipantsUpdate(m.chat, [sender], 'remove')
      await sleep(800)
      await this.sendMessage(m.chat, {
        text: `🚫 @${sender.split('@')[0]} fue eliminado por estar en *lista negra*.\n📝 Motivo: ${reason}`,
        mentions: [sender]
      })
      writeBlacklist(db)
    }
  } catch {}
}

// ================= AUTO-KICK AL ENTRAR =================

handler.before = async function (m) {
  try {
    if (![27, 31].includes(m.messageStubType)) return
    const db = readBlacklist()

    for (const user of m.messageStubParameters || []) {
      const u = normalizeJid(user)
      if (db[u]?.banned) {
        const reason = db[u].banReason || 'No especificado'
        await this.groupParticipantsUpdate(m.chat, [u], 'remove')
        await sleep(800)
        await this.sendMessage(m.chat, {
          text: `🚫 @${u.split('@')[0]} fue eliminado automáticamente por estar en *lista negra*.\n📝 Motivo: ${reason}`,
          mentions: [u]
        })
      }
    }
    writeBlacklist(db)
  } catch {}
}

// ================= CONFIG =================

handler.help = ['ln', 'unln', 'clrn', 'vln']
handler.tags = ['owner']
handler.command = ['ln', 'unln', 'clrn', 'vln']
handler.rowner = true

export default handler
