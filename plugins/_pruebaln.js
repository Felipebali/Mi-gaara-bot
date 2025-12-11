import fs from 'fs';
import path from 'path';

const dbFile = path.join(process.cwd(), 'blacklist.json');
const ownerNumbers = ["59898719147", "59896026646"];

// Inicializar archivo si no existe
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify({ blacklist: {} }, null, 2));

function readDB() { return JSON.parse(fs.readFileSync(dbFile, 'utf-8')); }
function writeDB(data) { fs.writeFileSync(dbFile, JSON.stringify(data, null, 2)); }

function getBlacklist() { 
  const data = readDB();
  return Object.entries(data.blacklist || {}).map(([jid, val]) => ({ jid, ...val }));
}
function isBlacklisted(jid) { return Boolean(readDB().blacklist[jid]); }
function addToBlacklist(jid, reason, phoneNumber) { 
  const data = readDB(); 
  data.blacklist[jid] = { reason, addedAt: Date.now(), phoneNumber }; 
  writeDB(data); 
}
function removeFromBlacklist(jid) { 
  const data = readDB(); 
  delete data.blacklist[jid]; 
  writeDB(data); 
}

// ----------------- PLUGIN HANDLER -----------------
let handler = async (m, { conn, command, text, isGroup }) => {
  try {
    let who, reason;
    let cleanText = text || "";
    if (command === "addn") cleanText = cleanText.replace(/^\.addn\s+/, '').trim();
    else cleanText = cleanText.replace(/^\.(remn|ln2)\s+/, '').trim();

    // Detectar número
    const phoneMatches = cleanText.match(/\+\d[\d\s]*/g);
    if (phoneMatches && phoneMatches.length > 0) {
      const cleanNumber = phoneMatches[0].replace(/\+|\s+/g, "");
      reason = command === "addn" ? cleanText.replace(phoneMatches[0], "").trim() : "";
      who = cleanNumber + "@s.whatsapp.net";
    } else {
      // Detectar mención o mensaje citado
      const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      who = mentions[0] || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.participant || null;
      reason = command === "addn" ? cleanText : "";
      if (who) {
        const whoNumber = who.split('@')[0];
        reason = reason.replace(`@${whoNumber}`, "").trim();
      }
    }

    // VALIDACIÓN
    if (!who && command !== 'listn') return await conn.sendText(m.chat, `⚠️ *Debes mencionar, citar o usar número.*\nEjemplo: .${command} @usuario razón`, m);

    const whoNumber = who?.split('@')[0];
    const botNumber = conn.user.jid.split('@')[0];
    const senderNumber = (m.key.participant || m.key.remoteJid).split('@')[0];

    if ([botNumber, senderNumber, ...ownerNumbers].includes(whoNumber)) {
      return await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    }

    // =========================
    // ACCIONES
    // =========================
    if (command === 'addn') {
      if (!reason) reason = "Sin razón especificada";
      addToBlacklist(who, reason, whoNumber);
      await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
      await conn.sendText(m.chat, `🚫 *Usuario agregado a lista negra*\n👤 @${whoNumber}\n📝 Razón: ${reason}`, m, { mentions: [who] });
    } else if (command === 'remn') {
      const allBlacklist = readDB().blacklist || {};
      let exists = null, correctJid = who;

      for (const [jid, entry] of Object.entries(allBlacklist)) {
        if (jid.split('@')[0] === whoNumber || entry.phoneNumber === whoNumber) {
          exists = entry;
          correctJid = jid;
          break;
        }
      }

      if (!exists) return await conn.sendText(m.chat, "ℹ️ *Ese usuario no está en la lista negra.*", m);

      removeFromBlacklist(correctJid);
      await conn.sendMessage(m.chat, { react: { text: '☑️', key: m.key } });
      await conn.sendText(m.chat, `✅ *Usuario removido de lista negra*\n👤 +${exists.phoneNumber || whoNumber}`, m);
    } else if (command === 'listn') {
      const entries = getBlacklist();
      if (entries.length === 0) return await conn.sendText(m.chat, "📋 *No hay usuarios en lista negra.*", m);

      let msg = `🚫 *LISTA NEGRA* (${entries.length} usuario${entries.length > 1 ? 's' : ''})\n\n`;
      entries.forEach((entry, i) => {
        const num = entry.jid.split("@")[0];
        const fecha = new Date(entry.addedAt).toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric' });
        msg += `${i+1}. @${num}\n   📝 Razón: ${entry.reason}\n   📅 Desde: ${fecha}\n\n`;
      });
      const jids = entries.map(e => e.jid);
      await conn.sendMessage(m.chat, { text: msg, mentions: jids }, { quoted: m });
    } else if (command === 'clrn') {
      writeDB({ blacklist: {} });
      await conn.sendMessage(m.chat, { react: { text: '🧹', key: m.key } });
      await conn.sendText(m.chat, "✅ *Lista negra limpiada*", m);
    }

  } catch (err) {
    console.error(err);
    await conn.sendText(m.chat, '⚠️ *Error al procesar la lista negra.*', m);
  }
};

// ----------------- METADATA -----------------
handler.help = ['addn', 'remn', 'clrn', 'listn'];
handler.tags = ['owner'];
handler.command = ['addn', 'remn', 'clrn', 'listn'];
handler.rowner = true;

export default handler;
