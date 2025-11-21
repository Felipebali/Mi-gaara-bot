// 📂 plugins/auto_ig.js — FelixCat_Bot 🐾
// Detecta links IG. Los owner NO tienen cooldown.
// Usuarios comunes → 1 promoción cada 10 horas.

const igLinkRegex = /(https?:\/\/)?(www\.)?instagram\.com\/[^\s]+/i;
const owners = [
  "59896026646@s.whatsapp.net",
  "59898719147@s.whatsapp.net"
]; // ✔ Owners sin límites

let handler = async (m, { conn }) => {
  if (!m?.text) return;
  if (!m.isGroup) return;

  const texto = m.text;
  const who = m.sender;

  if (!igLinkRegex.test(texto)) return;

  // ==== PARTICIPANTES ====
  const groupMetadata = await conn.groupMetadata(m.chat);
  const allParticipants = groupMetadata.participants.map(p => p.id);
  const hiddenMentions = allParticipants.filter(id => id !== who);

  // ==== OWNER → SIN COOLDOWN ====
  if (owners.includes(who)) {
    await conn.sendMessage(m.chat, { react: { text: '👑', key: m.key } });
    return await conn.sendMessage(m.chat, {
      text: `📢 Atención equipo: @${who.split("@")[0]} compartió su Instagram.\n¡Dale follow y apoyemos su perfil! ✨`,
      mentions: [who, ...hiddenMentions]
    });
  }

  // ==== BASE DE DATOS ====
  global.db.data.users[who] = global.db.data.users[who] || {};
  const last = global.db.data.users[who].cooldown_ig || 0;
  const now = Date.now();
  const cooldown = 10 * 60 * 60 * 1000; // 10h

  // ==== COOLDOWN ACTIVO ====
  if (now - last < cooldown) {
    return await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
  }

  // ==== ACTUALIZAR COOLDOWN ====
  global.db.data.users[who].cooldown_ig = now;

  // ==== PROMOCIÓN ====
  await conn.sendMessage(m.chat, { react: { text: '👑', key: m.key } });

  await conn.sendMessage(m.chat, {
    text: `📢 Atención equipo: @${who.split("@")[0]} compartió su Instagram.\n¡Dale follow y apoyemos su perfil! ✨`,
    mentions: [who, ...hiddenMentions]
  });
};

handler.customPrefix = igLinkRegex;
handler.command = new RegExp;

export default handler;
