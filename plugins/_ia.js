/* ---------------------------------------------------------------------------------------
  🍀 • By https://github.com/ALBERTO9883
  🍀 • ⚘Alberto Y Ashly⚘
  🔧 Fix & adaptación por Anubis para Feli
-----------------------------------------------------------------------------------------*/

import fs from 'fs'
import { randomBytes } from 'crypto'

const link = /chat\.whatsapp\.com/i

const handler = async (m, { conn, text, groupMetadata }) => {
  // ================= SEGURIDAD BASE =================
  if (m.isBaileys && m.fromMe) return
  if (!m.isGroup) return

  const datas = global
  const users = datas.db.data.users
  const user = users[m.sender] || (users[m.sender] = {})

  // ================= IDIOMA (FIX DEFINITIVO) =================
  const idioma =
    user.language ||
    global.defaultLenguaje ||
    'es'

  const langPath = `./src/languages/${idioma}.json`
  if (!fs.existsSync(langPath)) {
    throw `❌ Idioma no disponible: ${idioma}`
  }

  const _translate = JSON.parse(fs.readFileSync(langPath))
  const tradutor = _translate.plugins?.owner_chatgp
  if (!tradutor) throw '❌ Traducciones no encontradas'

  // ================= VALIDACIONES =================
  if (!text) throw tradutor.texto1
  if (link.test(text)) return conn.reply(m.chat, tradutor.texto2, m)

  // ================= COOLDOWN (5 MIN) =================
  const now = Date.now()
  const waitTime = 300000

  user.msgwait = user.msgwait || 0
  if (now - user.msgwait < waitTime) {
    throw `${tradutor.texto3[0]} ${msToTime(waitTime - (now - user.msgwait))} ${tradutor.texto3[1]}`
  }

  // ================= DATA =================
  const who =
    m.mentionedJid?.[0] ||
    (m.fromMe ? conn.user.jid : m.sender)

  const name = await conn.getName(m.sender)

  const groups = Object.entries(conn.chats)
    .filter(([jid, chat]) =>
      jid.endsWith('@g.us') &&
      chat.isChats &&
      !chat.metadata?.read_only &&
      !chat.metadata?.announce
    )
    .map(v => v[0])

  // ================= MENSAJE FAKE =================
  const fakegif = {
    key: {
      participant: '0@s.whatsapp.net',
      remoteJid: '6289643739077-1613049930@g.us'
    },
    message: {
      videoMessage: {
        title: '🐱 NyanCatBot - MD',
        seconds: '99999',
        gifPlayback: true,
        caption: '🧿 The Mystic Bot 🔮',
        jpegThumbnail: null
      }
    }
  }

  // ================= TEXTO =================
  const teks = `${tradutor.texto4[0]} ${groupMetadata.subject}
${tradutor.texto4[1]}${name}
*${tradutor.texto4[2]} wa.me/${who.split('@')[0]}
*${tradutor.texto4[3]} ${text}`

  // ================= ENVÍO =================
  for (const id of groups) {
    await conn.sendMessage(id, { text: teks }, { quoted: fakegif })
  }

  user.msgwait = now
}

// ================= CONFIG =================
handler.command = /^bot$/i
handler.owner = true
handler.group = true

export default handler

// ================= UTILIDADES =================
function msToTime(ms) {
  let seconds = Math.floor((ms / 1000) % 60)
  let minutes = Math.floor((ms / (1000 * 60)) % 60)
  minutes = minutes < 10 ? '0' + minutes : minutes
  seconds = seconds < 10 ? '0' + seconds : seconds
  return `${minutes} m ${seconds} s`
}

const randomID = (length) =>
  randomBytes(Math.ceil(length * 0.5)).toString('hex').slice(0, length)
