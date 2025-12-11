// 📂 plugins/propietario-banuser.js — FELI 2025 FINAL ARREGLADO v2
// Ban global + unban + listado + bloqueo automático
// TODAS las menciones usan: @${jid.split("@")[0]}

// ================= UTILIDADES =================
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

// Obtener un usuario REAL (mención, cita o texto)
function getRealUser(m, text) {
  let user = m?.mentionedJid?.[0] || m?.quoted?.sender;
  if (!user && text) user = normalizeJid(text);
  user = normalizeJid(user);
  if (!user) return null;
  const digits = user.replace(/[^0-9]/g, '');
  if (!digits || digits.length < 6) return null;
  return user;
}

const OWNERS = [
  '59896026646@s.whatsapp.net',
  '59898719147@s.whatsapp.net'
];

// ================= DETECTOR AUTOMÁTICO =================
// Bloquea TODOS los comandos si el usuario está baneado
export async function before(m) {
  global.db.data = global.db.data || {};
  global.db.data.banned = global.db.data.banned || [];

  if (OWNERS.includes(m.sender)) return;

  if (global.db.data.banned.includes(m.sender)) {
    return m.reply('🚫 *No puedes usar el bot porque estás baneado.*');
  }
}

// ================= HANDLER PRINCIPAL =================
let handler = async (m, { conn, text, command }) => {
  const isBan = command === 'banuser';
  const isUnban = command === 'unbanuser';
  const isList = command === 'listban';

  global.db.data = global.db.data || {};
  global.db.data.banned = global.db.data.banned || [];

  // ===== SOLO DUEÑOS =====
  if (!OWNERS.includes(m.sender))
    return m.reply('❌ *Solo mis dueños pueden usar este comando.*');

  // ===== LISTADO =====
  if (isList) {
    const list = global.db.data.banned;
    if (!list.length) return m.reply('📄 *Lista de baneados vacía.*');

    const msg = '🚫 *USUARIOS BANEADOS GLOBALMENTE*\n\n' +
      list.map((u, i) => `${i + 1}. @${u.split('@')[0]}`).join('\n');

    return conn.sendMessage(m.chat, { text: msg, mentions: list });
  }

  // ===== OBTENER USUARIO =====
  const who = getRealUser(m, text);
  if (!who) return m.reply('⚠️ *Debes mencionar, citar o escribir el número del usuario real.*');
  if (OWNERS.includes(who)) return m.reply('❌ *No puedo banear ni desbanear a un dueño.*');

  // ===== BAN =====
  if (isBan) {
    if (global.db.data.banned.includes(who))
      return m.reply('⚠️ *Ese usuario ya está baneado.*');

    global.db.data.banned.push(who);
    return conn.sendMessage(m.chat, {
      text: `🚫 *Usuario baneado globalmente*\n\n👤 *Usuario:* @${who.split("@")[0]}\n🔒 No podrá usar *ningún* comando del bot.`,
      mentions: [who]
    });
  }

  // ===== UNBAN =====
  if (isUnban) {
    if (!global.db.data.banned.includes(who))
      return m.reply('⚠️ *Ese usuario no está baneado.*');

    global.db.data.banned = global.db.data.banned.filter(v => v !== who);
    return conn.sendMessage(m.chat, {
      text: `✅ *Usuario desbaneado*\n\n👤 *Usuario:* @${who.split("@")[0]}\n🔓 Ya puede usar el bot normalmente.`,
      mentions: [who]
    });
  }
};

handler.help = ['banuser', 'unbanuser', 'listban'];
handler.tags = ['owner'];
handler.command = ['banuser', 'unbanuser', 'listban'];
handler.rowner = true;

export default handler;
