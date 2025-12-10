// 📂 propietario-listanegra.js — LOWDB LEGACY COMPATIBLE 💾
// Funciona en Termux, Gaara-MD, Nagi, MD, Baileys

import fs from 'fs'
import { join } from 'path'
import { Low, JSONFile } from 'lowdb'

// ==================== DATABASE ====================

const dbFolder = join(process.cwd(), 'database')
const dbPath = join(dbFolder, 'Blacklist.json')

// Crear carpeta si no existe
if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder)
}

const adapter = new JSONFile(dbPath)
const db = new Low(adapter)

await db.read()
if (!db.data) db.data = {}
if (!db.data.blacklist) db.data.blacklist = {}

const saveDB = () => db.write()

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

// ==================== HANDLER ====================

const handler = async (m, { conn, command, text }) => {

  const reacts = { addn: "🚫", remn: "☢️", listn: "📜", clrn: "🧹" }
  if (reacts[command])
    await conn.sendMessage(m.chat, { react: { text: reacts[command], key: m.key } })

  let userJid = null

  // Cita
  if (m.quoted) {
    userJid = normalizeJid(m.quoted.sender || m.quoted.participant)
  }
  // Mención
  else if (m.mentionedJid?.length) {
    userJid = normalizeJid(m.mentionedJid[0])
  }
  // Número
  else if (text) {
    const num = extractNumber(text)
    if (num) userJid = normalizeJid(num)
  }

  if (!userJid && !['listn', 'clrn'].includes(command))
    return conn.reply(m.chat, "🚫 Debes mencionar, citar o escribir número.", m)

  const reason = text?.replace(/@/g, '').replace(/\d+/g, '').trim() || "No especificado"

  // ========= ADD =========
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

    // AutoKick inmediato si fue una cita
    if (m.isGroup && m.quoted) {
      try {
        await sleep(500)
        await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove')
      } catch {}
    }
  }

  // ========= REMOVE =========
  else if (command === 'remn') {

    if (!db.data.blacklist[userJid])
      return conn.reply(m.chat, "🚫 El usuario no está en lista negra.", m)

    delete db.data.blacklist[userJid]
    await saveDB()

    await conn.sendMessage(m.chat, {
      text: `☢️ @${userJid.split('@')[0]} eliminado de la lista negra.`,
      mentions: [userJid]
    })
  }

  // ========= LIST =========
  else if (command === 'listn') {

    const ent = Object.entries(db.data.blacklist)
    if (ent.length === 0)
      return conn.reply(m.chat, "📜 Lista negra vacía.", m)

    let msg = "🚫 *LISTA NEGRA*\n\n"
    const mentions = []

    ent.forEach(([jid, data], i) => {
      msg += `*${i + 1}.* @${jid.split('@')[0]}\n`
      msg += `Motivo: ${data.reason}\n`
      msg += `Fecha: ${new Date(data.date).toLocaleString('es-UY')}\n\n`
      mentions.push(jid)
    })

    await conn.sendMessage(m.chat, { text: msg, mentions })
  }

  // ========= CLEAR =========
  else if (command === 'clrn') {
    db.data.blacklist = {}
    await saveDB()
    await conn.sendMessage(m.chat, { text: '🧹 Lista negra borrada.' })
  }
}

// ================= AUTO-KICK SI HABLA =================

handler.all = async function (m) {
  try {
    if (!m.isGroup || !m.sender) return
    const jid = normalizeJid(m.sender)

    if (db.data.blacklist[jid]?.banned) {
      await this.groupParticipantsUpdate(m.chat, [jid], 'remove')
    }
  } catch {}
}

// ================= CONFIG FINAL =================

handler.help = ['addn', 'remn', 'clrn', 'listn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'clrn', 'listn']
handler.rowner = true

export default handler
