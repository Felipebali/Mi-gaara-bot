import fs from 'fs'
import path from 'path'

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

const DATA_PATH = path.join(process.cwd(), 'data')
if (!fs.existsSync(DATA_PATH)) fs.mkdirSync(DATA_PATH)

const BLACKLIST_FILE = path.join(DATA_PATH, 'blacklist.json')

// Cargar lista negra al iniciar
let dbUsers = {}
if (fs.existsSync(BLACKLIST_FILE)) {
  try { dbUsers = JSON.parse(fs.readFileSync(BLACKLIST_FILE)) } catch {}
}
global.db.data.users = global.db.data.users || {}
Object.assign(global.db.data.users, dbUsers)

function saveBlacklist() {
  fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(global.db.data.users, null, 2))
}

// ================= UTILIDADES =================
function normalizeJid(jid = '') {
  if (!jid) return null
  jid = jid.toString().trim().replace(/^\+/, '')
  if (jid.endsWith('@c.us')) return jid.replace('@c.us', '@s.whatsapp.net')
  if (jid.endsWith('@s.whatsapp.net')) return jid
  if (jid.includes('@')) return jid
  const cleaned = jid.replace(/[^0-9]/g, '')
  if (!cleaned) return null
  return cleaned + '@s.whatsapp.net'
}

function digitsOnly(text = '') { return text.toString().replace(/[^0-9]/g, '') }
function extractPhoneNumber(text = '') {
  const d = digitsOnly(text)
  if (!d || d.length < 5) return null
  return d
}
function findParticipantByDigits(metadata, digits) {
  return metadata.participants.find(p => {
    const pd = digitsOnly(p.id)
    return pd === digits || pd.endsWith(digits)
  })
}

// ================= HANDLER =================
const handler = async (m, { conn, command, text }) => {
  const SEP = '━━━━━━━━━━━━━━━━━━━━'
  const emoji = '🚫'
  const ok = '✅'
  const warn = '⚠️'

  const users = global.db.data.users

  // AUTO-KICK AL CITAR
  if (m.isGroup && m.quoted) {
    const quotedJid = normalizeJid(m.quoted.sender || m.quoted.participant)
    if (quotedJid && users[quotedJid]?.banned) {
      try {
        const reason = users[quotedJid].banReason || 'No especificado'
        const meta = await conn.groupMetadata(m.chat)
        const participant = findParticipantByDigits(meta, digitsOnly(quotedJid))
        if (participant) {
          await conn.groupParticipantsUpdate(m.chat, [participant.id], 'remove')
          await sleep(700)
          await conn.sendMessage(m.chat, { text: `${emoji} *Eliminación inmediata*\n${SEP}\n@${participant.id.split('@')[0]}\n📝 ${reason}\n${SEP}`, mentions: [participant.id] })
        }
      } catch {}
    }
  }

  const bannedList = Object.entries(users).filter(([_, d]) => d.banned)
  let userJid = null
  let numberDigits = null

  if (command === 'remn' && /^\d+$/.test(text?.trim())) {
    const index = parseInt(text.trim()) - 1
    if (!bannedList[index]) return conn.reply(m.chat, `${emoji} Número inválido.`, m)
    userJid = bannedList[index][0]
  } else if (m.quoted) userJid = normalizeJid(m.quoted.sender || m.quoted.participant)
  else if (m.mentionedJid?.length) userJid = normalizeJid(m.mentionedJid[0])
  else if (text) {
    const num = extractPhoneNumber(text)
    if (num) { numberDigits = num; userJid = normalizeJid(num) }
  }

  let reason = text?.replace(/@/g, '').replace(/\d{5,}/g, '').trim() || 'No especificado'

  if (!userJid && !['listn','clrn'].includes(command)) return conn.reply(m.chat, `${warn} Debes responder, mencionar o usar índice.`, m)
  if (userJid && !users[userJid]) users[userJid] = {}

  // ADD
  if (command === 'addn') {
    if (numberDigits && !m.quoted && !m.mentionedJid) return conn.reply(m.chat, `${emoji} Usa mencionar o citar, no escribas números.`, m)
    users[userJid].banned = true
    users[userJid].banReason = reason
    users[userJid].bannedBy = m.sender
    saveBlacklist()
  }

  // REMOVER
  else if (command === 'remn') {
    if (!users[userJid]?.banned) return conn.reply(m.chat, `${emoji} No está en la lista negra.`, m)
    users[userJid] = { banned: false }
    saveBlacklist()
    await conn.sendMessage(m.chat, { text: `${ok} *Removido de lista negra*\n${SEP}\n@${userJid.split('@')[0]}`, mentions: [userJid] })
  }

  // LISTAR
  else if (command === 'listn') {
    if (!bannedList.length) return conn.reply(m.chat, `${ok} Lista negra vacía.`, m)
    let msg = `🚫 *Lista Negra — ${bannedList.length}*\n${SEP}\n`
    const mentions = []
    bannedList.forEach(([jid, d], i) => { msg += `*${i+1}.* @${jid.split('@')[0]}\n📝 ${d.banReason}\n\n`; mentions.push(jid) })
    msg += SEP
    await conn.sendMessage(m.chat, { text: msg.trim(), mentions })
  }

  // LIMPIAR
  else if (command === 'clrn') {
    for (const jid in users) users[jid].banned = false
    saveBlacklist()
    await conn.sendMessage(m.chat, { text: `${ok} Lista negra vaciada.` })
  }
}

// AUTO-KICK SI HABLA
handler.all = async function(m) {
  try {
    if (!m.isGroup) return
    const sender = normalizeJid(m.sender)
    if (!global.db.data.users[sender]?.banned) return

    const meta = await this.groupMetadata(m.chat)
    const participant = findParticipantByDigits(meta, digitsOnly(sender))
    if (!participant) return

    await this.groupParticipantsUpdate(m.chat, [participant.id], 'remove')
    await sleep(700)
    await this.sendMessage(m.chat, { text: `🚫 *Eliminado por LISTA NEGRA*\n━━━━━━━━━━━━━━━━━━━━\n@${participant.id.split('@')[0]}`, mentions: [participant.id] })
  } catch {}
}

// AUTO-KICK + AVISO AL ENTRAR
handler.before = async function(m) {
  try {
    if (![27,31].includes(m.messageStubType)) return
    if (!m.isGroup) return
    const meta = await this.groupMetadata(m.chat)
    for (const u of m.messageStubParameters || []) {
      const ujid = normalizeJid(u)
      const data = global.db.data.users[ujid]
      if (!data?.banned) continue
      const participant = findParticipantByDigits(meta, digitsOnly(ujid))
      if (!participant) continue
      const reason = data.banReason || 'No especificado'
      await this.groupParticipantsUpdate(m.chat, [participant.id], 'remove')
      await sleep(700)
      await this.sendMessage(m.chat, { text: `🚨 *USUARIO EN LISTA NEGRA*\n━━━━━━━━━━━━━━━━━━━━\n👤 @${participant.id.split('@')[0]}\n📝 Motivo: ${reason}\n🚫 Expulsión automática\n━━━━━━━━━━━━━━━━━━━━`, mentions: [participant.id] })
    }
  } catch {}
}

handler.help = ['addn','remn','listn','clrn']
handler.tags = ['owner']
handler.command = ['addn','remn','listn','clrn']
handler.rowner = true

export default handler
