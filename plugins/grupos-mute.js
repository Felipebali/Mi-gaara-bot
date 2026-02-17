// 📂 plugins/mute.js

let handler = async (m, { conn, text, usedPrefix, command, isAdmin, isBotAdmin }) => {

  if (!m.isGroup) return m.reply("❌ Solo funciona en grupos.");
  if (!isAdmin) return m.reply("⚠️ Solo admins pueden usar este comando.");
  if (!isBotAdmin) return m.reply("⚠️ El bot debe ser admin.");

  let who;

  const numberRegex = /@[0-9]+/g;
  const numberMatches = text.match(numberRegex);

  if (numberMatches && numberMatches.length > 0) {
    who = numberMatches[0].replace("@", "") + "@s.whatsapp.net";
  } else {
    who = m.mentionedJid?.[0]
      ? m.mentionedJid[0]
      : m.quoted
      ? m.quoted.sender
      : null;
  }

  if (!who) return m.reply(`✏️ Uso:\n${usedPrefix + command} @usuario`);

  // =====================
  // PROTEGER OWNERS
  // =====================
  const ownerJids = (global.owner || []).map(v => {
    if (Array.isArray(v)) v = v[0];
    return String(v).replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  });

  if (ownerJids.includes(who)) {
    return m.react("❌");
  }

  // =====================
  // BASE GLOBAL
  // =====================
  global.db.data.users = global.db.data.users || {};
  global.db.data.users[who] = global.db.data.users[who] || {};

  let user = global.db.data.users[who];

  user.mute = user.mute || {};
  user.mute[m.chat] = user.mute[m.chat] || false;

  let trueOrFalse =
    command === "desilenciar" || command === "unmute"
      ? false
      : true;

  user.mute[m.chat] = trueOrFalse;

  await m.react("☑️");

  if (trueOrFalse) {
    m.reply("🔇 Usuario silenciado correctamente.");
  } else {
    m.reply("🔊 Usuario desilenciado correctamente.");
  }

};

handler.command = [
  "silenciar",
  "mute",
  "desilenciar",
  "unmute",
  "silencio",
  "hacesilencio"
];

handler.tags = ["grupo"];
handler.help = ["mute @usuario", "unmute @usuario"];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
