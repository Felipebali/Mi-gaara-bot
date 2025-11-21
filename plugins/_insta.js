// 📂 plugins/auto_ig.js — FelixCat_Bot 🐾
// Detecta links de Instagram y promociona SOLO 1 vez cada 10 horas por usuario.
// Si vuelve a mandar IG antes → solo reacción 👑

const igLinkRegex = /(https?:\/\/)?(www\.)?instagram\.com\/[^\s]+/i;

let handler = async (m, { conn }) => {
  if (!m?.text) return;
  if (!m.isGroup) return;

  const texto = m.text;
  if (!igLinkRegex.test(texto)) return; // si no es link IG, ignorar

  const who = m.sender;

  // ==== BASE DE DATOS DE COOLDOWN POR USUARIO ====
  global.db.data.users[who] = global.db.data.users[who] || {};
  const last = global.db.data.users[who].cooldown_ig || 0;
  const now = Date.now();
  const cooldown = 10 * 60 * 60 * 1000; // 10 horas

  // ==== GRUPO: obtener participantes ====
  const groupMetadata = await conn.groupMetadata(m.chat);
  const allParticipants = groupMetadata.participants.map(p => p.id);
  const hiddenMentions = allParticipants.filter(id => id !== who);

  // ==== COOLDOWN ACTIVO → SOLO REACCION ====
  if (now - last < cooldown) {
    return await conn.sendMessage(m.chat, { react: { text: '👑', key: m.key } });
  }

  // ==== ACTUALIZAR COOLDOWN ====
  global.db.data.users[who].cooldown_ig = now;

  // ==== REACCIÓN IGUAL QUE TU ANTI-LINK ====
  await conn.sendMessage(m.chat, { react: { text: '👑', key: m.key } });

  // ==== PROMOCIÓN IGUAL QUE TU ESTILO ANTI-LINK ====
  await conn.sendMessage(m.chat, {
    text: `📢 Atención equipo: @${who.split("@")[0]} compartió su Instagram.\n¡Dale follow y apoyemos su perfil! ✨`,
    mentions: [who, ...hiddenMentions]
  });
};

handler.customPrefix = igLinkRegex;
handler.command = new RegExp; // necesario para customPrefix sin prefijo
export default handler;
