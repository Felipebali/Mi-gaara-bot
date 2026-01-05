// 📂 plugins/propietario-listanegra.js — FELI 2025 — BLACKLIST JSON 🔥

import fs from 'fs'
import path from 'path'

const BLACKLIST_FILE = path.join('./database', 'blacklist.json')

// Asegurarnos que exista el archivo
if (!fs.existsSync(BLACKLIST_FILE)) fs.writeFileSync(BLACKLIST_FILE, JSON.stringify({}))

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms))
}

// ================= UTILIDADES =================

function normalizeJid(jid = '') {
    if (!jid) return null
    // 🔹 Corregido regex: escapamos el + inicial
    jid = jid.toString().trim().replace(/^\+/, '')
    if (jid.endsWith('@c.us')) return jid.replace('@c.us', '@s.whatsapp.net')
    if (jid.endsWith('@s.whatsapp.net')) return jid
    if (jid.includes('@')) return jid
    const cleaned = jid.replace(/[^0-9]/g, '')
    if (!cleaned) return null
    return cleaned + '@s.whatsapp.net'
}

function digitsOnly(text = '') {
    return text.toString().replace(/[^0-9]/g, '')
}

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

// ================= BASE DE DATOS =================

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

// =====================================================
// ================= HANDLER PRINCIPAL =================
// =====================================================

const handler = async (m, { conn, command, text }) => {
    const SEP = '━━━━━━━━━━━━━━━━━━━━'
    const emoji = '🚫'
    const ok = '✅'
    const warn = '⚠️'

    const dbUsers = readBlacklist()

    // ================= AUTO-KICK AL CITAR =================
    if (m.isGroup && m.quoted) {
        const quotedJid = normalizeJid(m.quoted.sender || m.quoted.participant)
        if (quotedJid && dbUsers[quotedJid]?.banned) {
            try {
                const reason = dbUsers[quotedJid].reason || 'No especificado'
                const meta = await conn.groupMetadata(m.chat)
                const participant = findParticipantByDigits(meta, digitsOnly(quotedJid))
                if (participant) {
                    await conn.groupParticipantsUpdate(m.chat, [participant.id], 'remove')
                    await sleep(700)
                    await conn.sendMessage(m.chat, {
                        text: `${emoji} *Eliminación inmediata por LISTA NEGRA* ${SEP} @${participant.id.split('@')[0]} 📝 Motivo: ${reason} ${SEP}`,
                        mentions: [participant.id]
                    })
                }
            } catch {}
        }
    }

    const bannedList = Object.entries(dbUsers).filter(([_, d]) => d.banned)

    let userJid = null
    let numberDigits = null

    if (command === 'remn' && /^\d+$/.test(text?.trim())) {
        const index = parseInt(text.trim()) - 1
        if (!bannedList[index]) return conn.reply(m.chat, `${emoji} Número inválido.`, m)
        userJid = bannedList[index][0]
    } else if (m.quoted) {
        userJid = normalizeJid(m.quoted.sender || m.quoted.participant)
    } else if (m.mentionedJid?.length) {
        userJid = normalizeJid(m.mentionedJid[0])
    } else if (text) {
        const num = extractPhoneNumber(text)
        if (num) {
            numberDigits = num
            userJid = normalizeJid(num)
        }
    }

    let reason = text?.replace(/@/g, '').replace(/\d{5,}/g, '').trim()
    if (!reason) reason = 'No especificado'

    if (!userJid && !['listn', 'clrn'].includes(command))
        return conn.reply(m.chat, `${warn} Debes responder, mencionar o usar índice.`, m)

    if (userJid && !dbUsers[userJid]) dbUsers[userJid] = {}

    // ================= ADD =================
    if (command === 'addn') {
        if (numberDigits && !m.quoted && !m.mentionedJid)
            return conn.reply(m.chat, `${emoji} Usa mencionar o citar, no escribas números.`, m)

        dbUsers[userJid] = {
            banned: true,
            reason: reason,
            addedBy: m.sender
        }

        // ===== EXPULSIÓN GLOBAL =====
        try {
            const groups = Object.keys(await conn.groupFetchAllParticipating())
            for (const jid of groups) {
                await sleep(800)
                try {
                    const meta = await conn.groupMetadata(jid)
                    const participant = findParticipantByDigits(meta, digitsOnly(userJid))
                    if (!participant) continue

                    await conn.groupParticipantsUpdate(jid, [participant.id], 'remove')
                    await sleep(700)

                    await conn.sendMessage(jid, {
                        text: `🚫 *Usuario eliminado por LISTA NEGRA* ━━━━━━━━━━━━━━━━━━━━ 👤 @${participant.id.split('@')[0]} 📝 Motivo: ${reason} ━━━━━━━━━━━━━━━━━━━━`,
                        mentions: [participant.id]
                    })
                } catch {}
            }
        } catch {}

        writeBlacklist(dbUsers)
    }

    // ================= REMOVER =================
    else if (command === 'remn') {
        if (!dbUsers[userJid]?.banned) return conn.reply(m.chat, `${emoji} No está en la lista negra.`, m)

        dbUsers[userJid] = { banned: false }
        writeBlacklist(dbUsers)

        await conn.sendMessage(m.chat, {
            text: `${ok} *Removido de lista negra* ${SEP} @${userJid.split('@')[0]}`,
            mentions: [userJid]
        })
    }

    // ================= LISTAR =================
    else if (command === 'listn') {
        if (!bannedList.length) return conn.reply(m.chat, `${ok} Lista negra vacía.`, m)

        let msg = `🚫 *Lista Negra — ${bannedList.length}*\n${SEP}\n`
        const mentions = []

        bannedList.forEach(([jid, d], i) => {
            msg += `*${i + 1}.* @${jid.split('@')[0]}\n📝 ${d.reason}\n\n`
            mentions.push(jid)
        })

        msg += SEP
        await conn.sendMessage(m.chat, { text: msg.trim(), mentions })
    }

    // ================= LIMPIAR =================
    else if (command === 'clrn') {
        for (const jid in dbUsers) dbUsers[jid].banned = false
        writeBlacklist(dbUsers)
        await conn.sendMessage(m.chat, { text: `${ok} Lista negra vaciada.` })
    }
}

// =====================================================
// ================= AUTO-KICK SI HABLA =================
// =====================================================
handler.all = async function (m) {
    try {
        if (!m.isGroup) return
        const sender = normalizeJid(m.sender)
        const dbUsers = readBlacklist()
        if (!dbUsers[sender]?.banned) return

        const meta = await this.groupMetadata(m.chat)
        const participant = findParticipantByDigits(meta, digitsOnly(sender))
        if (!participant) return

        await this.groupParticipantsUpdate(m.chat, [participant.id], 'remove')
        await sleep(700)

        await this.sendMessage(m.chat, {
            text: `🚫 *Eliminado por LISTA NEGRA* ━━━━━━━━━━━━━━━━━━━━ @${participant.id.split('@')[0]}`,
            mentions: [participant.id]
        })
    } catch {}
}

// =====================================================
// ========== AUTO-KICK + AVISO AL ENTRAR =================
// =====================================================
handler.before = async function (m) {
    try {
        if (![27, 31].includes(m.messageStubType)) return
        if (!m.isGroup) return

        const dbUsers = readBlacklist()
        const meta = await this.groupMetadata(m.chat)
        for (const u of m.messageStubParameters || []) {
            const ujid = normalizeJid(u)
            const data = dbUsers[ujid]
            if (!data?.banned) continue

            const participant = findParticipantByDigits(meta, digitsOnly(ujid))
            if (!participant) continue

            const reason = data.reason || 'No especificado'

            await this.groupParticipantsUpdate(m.chat, [participant.id], 'remove')
            await sleep(700)

            await this.sendMessage(m.chat, {
                text: `🚨 *USUARIO EN LISTA NEGRA* ━━━━━━━━━━━━━━━━━━━━ 👤 @${participant.id.split('@')[0]} 📝 Motivo: ${reason} 🚫 Expulsión automática ━━━━━━━━━━━━━━━━━━━━`,
                mentions: [participant.id]
            })
        }
    } catch {}
}

// ================= CONFIG =================
handler.help = ['addn', 'remn', 'listn', 'clrn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'listn', 'clrn']
handler.rowner = true

export default handler
