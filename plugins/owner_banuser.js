// 📂 plugins/propietario-banuser.js — FELI 2025
// Ban global + desban + listado + bloqueo automático SIN tocar otros archivos.

// ================= UTILIDADES =================
function normalizeJid(jid = '') {
  if (!jid) return null;
  jid = jid.toString().trim();

  // Si viene +598..., 598..., etc.
  jid = jid.replace(/[^0-9]/g, '');

  if (/^\d{7,15}$/.test(jid)) jid = jid + '@s.whatsapp.net';

  jid = jid.replace(/@c\.us$/, '@s.whatsapp.net');
  return jid;
}

const OWNERS = [
  '59896026646@s.whatsapp.net',
  '59898719147@s.whatsapp.net'
];

// ================= DETECTOR AUTOMÁTICO =================
// (No tocar nada más fuera de este plugin)
export async function before(m, { conn }) {
  global.db.data = global.db.data || {};
  global.db.data.banned = global.db.data.banned || [];

  // Evita bloquear a dueños
  if (OWNERS.includes(m.sender)) return;

  // Si está baneado → Bloquea cualquier comando
  if (global.db.data.banned.includes(m.sender)) {
    if (m.text && m.text.startsWith('.')) { 
      return m.reply('🚫 *No puedes usar el bot porque estás baneado.*');
    }
  }
}

// ================= HANDLER PRINCIPAL =================
let handler = async (m, { conn, text, command }) => {
  const isBan = command === 'banuser';
  const isUnban = command === 'desbanuser';
  const isList = command === 'listban';

  global.db.data = global.db.data || {};
  global.db.data.banned = global.db.data.banned || [];

  // ===== SOLO DUEÑOS =====
  if (!OWNERS.includes(m.sender))
    return m.reply('❌ *Solo mis dueños pueden usar este comando.*');

  // ===== LISTADO =====
  if (isList) {
    let list = global.db.data.banned;
    if (!list.length) return m.reply('📄 *Lista de baneados vacía.*');

    let msg = '🚫 *USUARIOS BANEADOS GLOBALMENTE*\n\n';
    msg += list.map((u, i) => `${i + 1}. wa.me/${u.split('@')[0]}`).join('\n');
    return m.reply(msg);
  }

  // ===== OBTENER USUARIO =====
  let target;

  if (m.quoted) {
    target = m.quoted.sender;
  } else if (m.mentionedJid?.length) {
    target = m.mentionedJid[0];
  } else if (text) {
    target = normalizeJid(text);
  }

  target = normalizeJid(target);
  if (!target)
    return m.reply('⚠️ *Debes mencionar, citar o escribir el número del usuario.*');

  if (OWNERS.includes(target))
    return m.reply('❌ *No puedo banear ni desbanear a un dueño.*');

  // ===== BAN =====
  if (isBan) {
    if (global.db.data.banned.includes(target))
      return m.reply('⚠️ *Ese usuario ya está baneado.*');

    global.db.data.banned.push(target);

    return conn.sendMessage(
      m.chat,
      {
        text:
          `🚫 *Usuario baneado globalmente*\n\n` +
          `👤 @${target.split('@')[0]}\n` +
          `🔒 No podrá usar *ningún* comando del bot.`,
        mentions: [target]
      }
    );
  }

  // ===== DESBAN =====
  if (isUnban) {
    if (!global.db.data.banned.includes(target))
      return m.reply('⚠️ *Ese usuario no está baneado.*');

    global.db.data.banned = global.db.data.banned.filter(v => v !== target);

    return conn.sendMessage(
      m.chat,
      {
        text:
          `✅ *Usuario desbaneado*\n\n` +
          `👤 @${target.split('@')[0]}\n` +
          `🔓 Ya puede usar el bot normalmente.`,
        mentions: [target]
      }
    );
  }
};

handler.help = ['banuser', 'desbanuser', 'listban'];
handler.tags = ['owner'];
handler.command = ['banuser', 'desbanuser', 'listban'];
handler.rowner = true;

export default handler;
