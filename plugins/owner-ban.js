import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'blacklist.json');

function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }, null, 2));
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.log('Error leyendo DB:', e);
    return { users: {} };
  }
}

function saveDB(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    console.log('DB guardada correctamente ✅');
  } catch (e) {
    console.log('Error guardando DB:', e);
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
function normalizeJid(jid = '') {
  if (!jid) return null;
  jid = jid.toString().trim().replace(/^\+/, '');
  if (jid.endsWith('@c.us') || jid.endsWith('@s.whatsapp.net'))
    return jid.replace(/@c.us$/, '@s.whatsapp.net');
  if (jid.includes('@')) return jid;
  const cleaned = jid.replace(/[^0-9]/g, '');
  if (!cleaned) return null;
  return cleaned + '@s.whatsapp.net';
}
function digitsOnly(text = '') { return (text || '').toString().replace(/[^0-9]/g, '') }
function extractPhoneNumber(text = '') { const d = digitsOnly(text); return (!d || d.length < 5) ? null : d }

// ================= HANDLER =================
const handler = async (m, { conn, command, text }) => {
  const db = loadDB();
  const dbUsers = db.users || (db.users = {});
  const SEP = '━━━━━━━━━━━━━━━━━━━━';
  const emoji = '🚫';
  const ok = '✅';
  const warn = '⚠️';

  let userJid = null;

  const bannedList = Object.entries(dbUsers).filter(([_, d]) => d.banned);

  if (command === 'remn' && /^\d+$/.test(text?.trim())) {
    const index = parseInt(text.trim()) - 1;
    if (!bannedList[index]) return conn.reply(m.chat, `${emoji} Número inválido.`, m);
    userJid = bannedList[index][0];
  } else if (m.quoted) userJid = normalizeJid(m.quoted.sender || m.quoted.participant);
  else if (m.mentionedJid?.length) userJid = normalizeJid(m.mentionedJid[0]);
  else if (text) { const num = extractPhoneNumber(text); if (num) userJid = normalizeJid(num); }

  let reason = text?.replace(/@/g, '').replace(/\d{5,}/g, '').trim() || 'No especificado';
  if (!userJid && !['listn', 'clrn'].includes(command))
    return conn.reply(m.chat, `${warn} Debes responder, mencionar o usar índice.`, m);
  if (userJid && !dbUsers[userJid]) dbUsers[userJid] = {};

  // ================= ADD =================
  if (command === 'addn') {
    dbUsers[userJid].banned = true;
    dbUsers[userJid].banReason = reason;
    dbUsers[userJid].bannedBy = m.sender;

    saveDB(db); // GUARDA inmediatamente

    await conn.sendMessage(m.chat, { text: `${ok} *Agregado a LISTA NEGRA*\n${SEP}\n@${userJid.split('@')[0]} agregado.\n📝 Motivo: ${reason}\n${SEP}`, mentions: [userJid] });

    // Auto expulsión en el grupo
    if (m.isGroup) {
      try {
        const meta = await conn.groupMetadata(m.chat);
        if (meta.participants.some(p => normalizeJid(p.id) === userJid)) {
          await conn.groupParticipantsUpdate(m.chat, [userJid], 'remove');
          await sleep(600);
        }
      } catch {}
    }
  }

  // ================= REMOVER =================
  else if (command === 'remn') {
    if (!userJid || !dbUsers[userJid]?.banned)
      return conn.reply(m.chat, `${emoji} No está en la lista negra.`, m);

    dbUsers[userJid].banned = false;
    dbUsers[userJid].banReason = '';
    dbUsers[userJid].bannedBy = null;

    saveDB(db); // GUARDA inmediatamente

    await conn.sendMessage(m.chat, { text: `${ok} *Removido de lista negra*\n${SEP}\n@${userJid.split('@')[0]} removido.`, mentions: [userJid] });
  }

  // ================= LISTAR =================
  else if (command === 'listn') {
    if (bannedList.length === 0) return conn.reply(m.chat, `${ok} Lista negra vacía.`, m);
    let list = `🚫 *Lista Negra — ${bannedList.length}*\n${SEP}\n`;
    const mentions = [];
    bannedList.forEach(([jid, data], i) => { list += `*${i + 1}.* @${jid.split('@')[0]}\n📝 ${data.banReason || 'No especificado'}\n\n`; mentions.push(jid); });
    list += SEP;
    await conn.sendMessage(m.chat, { text: list.trim(), mentions });
  }

  // ================= LIMPIAR =================
  else if (command === 'clrn') {
    for (const jid in dbUsers) { if (dbUsers[jid]?.banned) { dbUsers[jid].banned = false; dbUsers[jid].banReason = ''; dbUsers[jid].bannedBy = null; } }
    saveDB(db); // GUARDA inmediatamente
    await conn.sendMessage(m.chat, { text: `${ok} Lista negra vaciada.` });
  }
}

// ============== AUTO-KICK SI HABLA ==============
handler.all = async function (m) {
  try {
    if (!m.isGroup || !m.sender) return;
    const db = loadDB().users;
    const sender = normalizeJid(m.sender);
    if (sender && db[sender]?.banned) {
      const meta = await this.groupMetadata(m.chat);
      if (meta.participants.some(p => normalizeJid(p.id) === sender)) {
        await this.groupParticipantsUpdate(m.chat, [sender], 'remove');
        await sleep(600);
        await this.sendMessage(m.chat, { text: `🚫 *Eliminado por LISTA NEGRA*\n@${sender.split('@')[0]} eliminado.`, mentions: [sender] });
      }
    }
  } catch {}
}

// ============== AUTO-KICK AL ENTRAR ==============
handler.before = async function (m) {
  try {
    if (![27, 31].includes(m.messageStubType)) return;
    const db = loadDB().users;
    const conn = this;
    for (const user of m.messageStubParameters || []) {
      const u = normalizeJid(user);
      if (!u) continue;
      if (db[u]?.banned) {
        await sleep(600);
        await conn.groupParticipantsUpdate(m.chat, [u], 'remove');
        await sleep(600);
        await conn.sendMessage(m.chat, { text: `🚫 *Expulsado automáticamente*\n@${u.split('@')[0]} eliminado.`, mentions: [u] });
      }
    }
  } catch {}
}

handler.help = ['addn', 'remn', 'clrn', 'listn']
handler.tags = ['owner']
handler.command = ['addn', 'remn', 'clrn', 'listn']
handler.rowner = true

export default handler;
