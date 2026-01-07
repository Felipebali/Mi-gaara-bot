// 📂 plugins/propietario-listanegra.js — FELI 2025 — BLACKLIST JSON 🔥

import fs from 'fs'
import path from 'path'

const DATABASE_DIR = './database'
const BLACKLIST_FILE = path.join(DATABASE_DIR, 'blacklist.json')

if (!fs.existsSync(DATABASE_DIR)) fs.mkdirSync(DATABASE_DIR, { recursive: true })
if (!fs.existsSync(BLACKLIST_FILE)) fs.writeFileSync(BLACKLIST_FILE, JSON.stringify({}))

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ================= UTILIDADES =================

const normalizeJid = jid => {
  if (!jid) return null
  jid = jid.toString().split(':')[0].replace(/^\+/, '')
  if (jid.endsWith('@c.us')) jid = jid.replace('@c.us', '@s.whatsapp.net')
  if (!jid.endsWith('@s.whatsapp.net')) jid += '@s.whatsapp.net'
  return jid
}

const digitsOnly = t => t.replace(/\D+/g, '')

const findParticipant = (meta, jid) =>
  meta.participants.find(p => digitsOnly(p.id) === digitsOnly(jid))

// ================= DB =================

const readDB = () => JSON.parse(fs.readFileSync(BLACKLIST_FILE))
const writeDB = d => fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(d, null, 2))

// =====================================================
// ================= HANDLER PRINCIPAL =================
// =====================================================

const handler = async (m, { conn, command, text }) => {

  const SEP = '━━━━━━━━━━━━━━━━━━━━'
  const ICON = { ban: '🚫', ok: '✅', warn: '⚠️' }

  const db = readDB()
  const banned = Object.entries(db).filter(([_, d]) => d.banned)

  let target = null

  // ======= IDENTIFICACIÓN REAL DEL USUARIO =======

  if (m.quoted) {
    const q = m.quoted
    target = normalizeJid(q.sender || q.participant || q.from)
  }
  else if (m.mentionedJid?.length) {
    target = normalizeJid(m.mentionedJid[0])
  }
  else if (command === 'unln' && /^\d+$/.test(text)) {
    const i = parseInt(text) - 1
    if (!banned[i]) return m.reply(`${ICON.ban} Número inválido.`)
    target = banned[i][0]
  }

  if (!target && !['vln','clrn'].includes(command))
    return m.reply(`${ICON.warn} Responde o menciona a alguien.`)

  // ======= MOTIVO =======
  let reason = text?.replace(/@\S+/g, '').trim() || 'No especificado'

  // ================= ADD =================
  if (command === 'ln') {

    db[target] = { banned: true, reason, addedBy: m.sender }
    writeDB(db)

    if (m.isGroup) {
      const meta = await conn.groupMetadata(m.chat)
      const p = findParticipant(meta, target)

      if (p) {
        await conn.groupParticipantsUpdate(m.chat, [p.id], 'remove')
        await sleep(500)
      }
    }

    return conn.sendMessage(m.chat, {
      text: `${ICON.ban} *USUARIO BLOQUEADO*\n${SEP}\n👤 @${target.split('@')[0]}\n📝 *Motivo:* ${reason}\n${SEP}`,
      mentions: [target]
    })
  }

  // ================= REMOVE =================
  if (command === 'unln') {
    if (!db[target]?.banned) return m.reply(`${ICON.ban} No está en lista negra.`)
    db[target].banned = false
    writeDB(db)

    return conn.sendMessage(m.chat, {
      text: `${ICON.ok} *USUARIO LIBERADO*\n${SEP}\n👤 @${target.split('@')[0]}\n${SEP}`,
      mentions: [target]
    })
  }

  // ================= LIST =================
  if (command === 'vln') {
    if (!banned.length) return m.reply(`${ICON.ok} Lista vacía.`)

    let msg = `${ICON.ban} *LISTA NEGRA*\n${SEP}\n`
    const mentions = []

    banned.forEach(([jid,d],i)=>{
      msg += `${i+1}. @${jid.split('@')[0]}\n📝 ${d.reason}\n\n`
      mentions.push(jid)
    })

    return conn.sendMessage(m.chat,{ text: msg.trim(), mentions })
  }

  // ================= CLEAR =================
  if (command === 'clrn') {
    for (const u in db) db[u].banned = false
    writeDB(db)
    return m.reply(`${ICON.ok} Lista negra vaciada.`)
  }
}

// =====================================================
// ================= AUTO-KICK =================
// =====================================================

handler.all = async function (m) {
  if (!m.isGroup) return

  const db = readDB()
  const user = normalizeJid(m.sender)

  if (!db[user]?.banned) return

  const meta = await this.groupMetadata(m.chat)
  const p = findParticipant(meta, user)
  if (!p) return

  await this.groupParticipantsUpdate(m.chat, [p.id], 'remove')
}

// ================= CONFIG =================

handler.command = ['ln','unln','vln','clrn']
handler.help = handler.command
handler.tags = ['owner']
handler.rowner = true

export default handler
