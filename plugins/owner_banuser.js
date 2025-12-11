// 📂 plugins/propietario-banuser.js — FELI 2025 FINAL
// Ban global + desban + listado + bloqueo automático
// TODAS las menciones usan: @${jid.split("@")[0]}

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
// Bloquea todos los comandos si el user está baneado
export async function before(m) {
  global.db.data = global.db.data || {};
  global.db.data.banned = global.db.data.banned || [];

  if (OWNERS.includes(m.sender)) return;

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
    msg += list.map((u, i) => `${i + 1}. @${u.split('@')[0]}`).join('\n');

    return conn.sendMessage(m.chat, {
      text: msg,
      mentions: list
    });
  }

  // ===== OBTENER USUARIO =====
  let who;

  if (m.quoted) {
    who = m.quoted.sender;
  } else if (m.mentionedJid?.length) {
    who = m.mentionedJid[0];
  } else if (text) {
    who = normalizeJid(text);
  }

  who = normalizeJid(who);

  if (!who)
    return m.reply('⚠️ *Debes mencionar, citar o escribir el número del usuario.*');

  if (OWNERS.includes(who))
    return m.reply('❌ *No puedo banear ni desbanear a un dueño.*');

  // ===== BAN =====
  if (isBan) {
    if (global.db.data.banned.includes(who))
      return m.reply('⚠️ *Ese usuario ya está baneado.*');

    global.db.data.banned.push(who);

    return conn.sendMessage(
      m.chat,
      {
        text:
`🚫 *Usuario baneado globalmente*

👤 *Usuario:* @${who.split("@")[0]}
🔒 No podrá usar *ningún* comando del bot.`,
        mentions: [who]
      }
    );
  }

  // ===== DESBAN =====
  if (isUnban) {
    if (!global.db.data.banned.includes(who))
      return m.reply('⚠️ *Ese usuario no está baneado.*');

    global.db.data.banned = global.db.data.banned.filter(v => v !== who);

    return conn.sendMessage(
      m.chat,
      {
        text:
`✅ *Usuario desbaneado*

👤 *Usuario:* @${who.split("@")[0]}
🔓 Ya puede usar el bot normalmente.`,
        mentions: [who]
      }
    );
  }
};

handler.help = ['banuser', 'desbanuser', 'listban'];
handler.tags = ['owner'];
handler.command = ['banuser', 'desbanuser', 'listban'];
handler.rowner = true;

export default handler;
