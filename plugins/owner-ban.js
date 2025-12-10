// 📂 plugins/propietario-listanegra.js — VERSION LOWDB FINAL 💾
// (BASE DE DATOS REAL + AUTOKICK + AVISO AL ENTRAR + AUTO-KICK POR CITA)

import fs from 'fs'
import { join } from 'path'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

// ==================== DATABASE ====================

const dbFolder = join(process.cwd(), 'database')
const dbPath = join(dbFolder, 'Blacklist.json')

// Crear carpeta /database si no existe
if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder)
}

const adapter = new JSONFile(dbPath)
const db = new Low(adapter, { blacklist: {} })

await db.read()

// 🔥 COMPATIBILIDAD TOTAL (ACEPTADO POR TODOS LOS LOADERS)
if (!db.data) db.data = {}
if (!db.data.blacklist) db.data.blacklist = {}

function saveDB() {
  return db.write()
}

// ==================== UTILIDADES ====================

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function normalizeJid(jid = '') {
  if (!jid) return null
  jid = jid.toString().trim().replace(/^\+/, '')
  if (jid.endsWith('@c.us') || jid.endsWith('@s.whatsapp.net'))
    return jid.replace(/@c.us$/, '@s.whatsapp.net')
  if (jid.includes('@')) return jid
  return jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
}

function digitsOnly(txt = '') {
  return txt.toString().replace(/[^0-9]/g, '')
}

function extractNumber(text = '') {
  const d = digitsOnly(text)
  return d.length >= 5 ? d : null
}

function findMemberByDigits(group, digits) {
  if (!group?.participants) return null
  for (const p of group.participants) {
    const id = p.id || p
    const d = digitsOnly(id)
    if (!d) continue
    if (d === digits || d.endsWith(digits) || digits.endsWith(d)) return id
    if (d.includes(digits) || digits.includes(d)) return id
  }
  return null
}

// ==================== HANDLER PRINCIPAL ====================

const handler = async (m, { conn, command, text }) => {

  const reactions = { addn: '🚫', remn: '☢️', listn: '📜', clrn: '🧹' }
  if (reactions[command])
    await conn.sendMessage(m.chat, { react: { text: reactions[command], key: m.key } })

  let userJid = null
  let digits = null

  const entries = Object.entries(db.data.blacklist)

  // --- Selección por número en la lista ---
  if (command === 'remn' && /^\d+$/.test(text?.trim())) {
    const index = parseInt(text.trim()) - 1
    if (!entries[index])
      return conn.reply(m.chat, '🚫 Número inválido en la lista.', m)
    userJid = entries[index][0]
  }

  // --- Cita ---
  else if (m.quoted) {
    userJid = normalizeJid(m.quoted.sender || m.quoted.participant)
  }

  // --- Mención ---
  else if (m.mentionedJid?.length) {
    userJid = normalizeJid(m.mentionedJid[0])
  }

  // --- Número ---
  else if (text) {
    const num = extractNumber(text)
    if (num) {
      digits = num
      userJid = normalizeJid(num)
    }
  }

  let reason = text?.replace(/@/g, '').replace(/\d{5,}/g, '').trim()
  if (!reason) reason = 'No especificado'

  if (!userJid && !['listn', 'clrn'].includes(command))
    return conn.reply(m.chat, '🚫 Debes mencionar, citar o escribir un número.', m)

  // ================= ADD =================

  if (command === 'addn') {

    db.data.blacklist[userJid] = {
      banned: true,
      reason,
      bannedBy: m.sender,
      date: Date.now()
    }

    await saveDB()

    await conn.sendMessage(m.chat, {
      text: `🚫 @${userJid.split('@')[0]} agregado a *lista negra*.\n📝 Motivo: ${reason}`,
      mentions: [userJid]
    })

    // AutoKick inmediato si fue por cita
    if (m.isGroup && m.quoted) {
      try {
        await sleep(600)
        await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove')

        await conn.sendMessage(m.chat, {
          text: `🚫 @${userJid.split('@')[0]} fue eliminado automáticamente por estar en *lista negra*.`,
          mentions: [userJid]
        })
      } catch {}
    }

    // AutoKick global en todos los grupos
    const groups = Object.keys(await conn.groupFetchAllParticipating())

    for (const gid of groups) {
      await sleep(1200)
      try {
        const meta = await conn.groupMetadata(gid)
        let member = meta.participants.find(p => normalizeJid(p.id) === userJid)
        if (!member && digits) member = findMemberByDigits(meta, digits)
        if (!member) continue

        const id = member.id || member
        await conn.groupParticipantsUpdate(gid, [id], 'remove')

        await conn.sendMessage(gid, {
          text: `🚫 @${id.split('@')[0]} fue eliminado por estar en *lista negra*.\n📝 Motivo: ${reason}`,
          mentions: [id]
        })
      } catch {}
    }
  }

  // ================= REMOVE =================

  else if (command === 'remn') {

    if (!db.data.blacklist[userJid])
      return conn.reply(m.chat, '🚫 Ese usuario no está en lista negra.', m)

    delete db.data.blacklist[userJid]
    await saveDB()

    await conn.sendMessage(m.chat, {
      text: `☢️ @${userJid.split('@')[0]} eliminado de la *lista negra*.`,
      mentions: [userJid]
    })
  }

  // ================= LIST =================

  else if (command === 'listn') {

    if (entries.length === 0)
      return conn.reply(m.chat, '📜 Lista negra vacía.', m)

    let msg = '🚫 *LISTA NEGRA*\n\n'
    const mentions = []

    entries.forEach(([jid, data], i) => {
      msg += `*${i + 1}.* @${jid.split('@')[0]}\n`
      msg += `Motivo: ${data.reason}\n`
      msg += `Fecha: ${new Date(data.date).toLocaleString('es-UY')}\n\n`
      mentions.push(jid)
    })

    await conn.sendMessage(m.chat, { text: msg, mentions })
  }

  // ================= CLEAR =================

  else if (command === 'clrn') {
    db.data.blacklist = {}
    await saveDB()
    await conn.sendMessage(m.chat, { text: '🧹 Lista negra limpiada.' })
  }
}

// ================= AUTO-KICK SI HABLA =================

handler.all = async function (m) {
  try {
    if (!m.isGroup || !m.sender) return

    const jid = normalizeJid(m.sender)

    if (db.data.blacklist[jid]?.banned) {
      const reason = db.data.blacklist[jid].reason

      await this.groupParticipantsUpdate(m.chat, [jid], 'remove')

      await this.sendMessage(m.chat, {
        text: `🚫 @${jid.split('@')[0]} eliminado por estar en *lista negra*.\n📝 Motivo: ${reason}`,
        mentions: [jid]
      })
    }
  } catch {}
}

// ================= AUTO-KICK AL ENTRAR =================

handler.before = async function (m) {
  try {
    if (![27, 31].includes(m.messageStubType)) return

    for (const u of m.messageStubParameters || []) {
      const jid = normalizeJid(u)

      if (db.data.blacklist[jid]?.banned) {
        const reason = db.data.blacklist[jid].reason

        await sleep(500)
        await this.groupParticipantsUpdate(m.chat, [jid], 'remove')

        await this.sendMessage(m.chat, {
          text: `🚫 @${jid.split('@')[0]} expulsado automáticamente.\n📝 Motivo: ${reason}`,
          mentions: [jid]
        })
      }
    }
  } catch {}
}

// ================= CONFIG FINAL =================

handler.help = ['addn', 'remn', 'clrn', 'listn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'clrn', 'listn']
handler.rowner = true

export default handler
