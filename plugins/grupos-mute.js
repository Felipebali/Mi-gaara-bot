// 📂 plugins/mute.js

let handler = async (m, { conn, text, usedPrefix, command, isAdmin, isBotAdmin }) => {

  if (!m.isGroup) return m.reply("❌ Solo funciona en grupos.");
  if (!isAdmin) return m.reply("⚠️ Solo admins pueden usar este comando.");
  if (!isBotAdmin) return m.reply("⚠️ El bot debe ser admin.");

  let who;

  if (m.mentionedJid && m.mentionedJid[0]) {
    who = m.mentionedJid[0];
  } else if (m.quoted) {
    who = m.quoted.sender;
  }

  if (!who) return m.reply(`✏️ Uso:\n${usedPrefix + command} @usuario`);

  // 🔐 PROTEGER OWNERS
  const ownerJids = (global.owner || []).map(v => {
    if (Array.isArray(v)) v = v[0];
    return String(v).replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  });

  if (ownerJids.includes(who)) return m.react("❌");

  // 📂 BASE
  global.db.data.users = global.db.data.users || {};
  global.db.data.users[who] = global.db.data.users[who] || {};

  let user = global.db.data.users[who];

  user.mute = user.mute || {};
  user.mute[m.chat] = user.mute[m.chat] || false;

  let estado = (command === "desilenciar" || command === "unmute") ? false : true;

  user.mute[m.chat] = estado;

  await m.react("☑️");

  m.reply(estado
    ? "🔇 Usuario silenciado correctamente."
    : "🔊 Usuario desilenciado correctamente."
  );

};

handler.command = [
  "silenciar",
  "mute",
  "desilenciar",
  "unmute"
];

handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;



// =============================
// 🚨 BEFORE (BORRAR MENSAJES)
// =============================

export async function before(m, { conn, isAdmin }) {

  if (!m.isGroup) return false;
  if (!m.sender) return false;

  global.db.data.users = global.db.data.users || {};
  let user = global.db.data.users[m.sender];

  if (!user) return false;
  if (!user.mute) return false;
  if (!user.mute[m.chat]) return false;

  // ❗ No borrar admins
  if (isAdmin) return false;

  try {

    await conn.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: false,
        id: m.key.id,
        participant: m.sender
      }
    });

  } catch (e) {
    console.log("Error borrando:", e);
  }

  return true;
}
