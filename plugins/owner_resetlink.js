// 📂 plugins/owner-resetlink.js
let handler = async (m, { conn, participants, groupMetadata }) => {
  // IDs de los dueños
  const owners = ['59896026646@s.whatsapp.net', '59898719147@s.whatsapp.net', '59892363485@s.whatsapp.net'];
  const sender = m.sender;

  // Verificación: solo dueños
  if (!owners.includes(sender)) {
    return conn.reply(m.chat, '🚫 Este comando solo puede usarlo mi creador.', m);
  }

  // Solo funciona en grupos
  if (!m.isGroup) {
    return conn.reply(m.chat, '❌ Este comando solo se puede usar en grupos.', m);
  }

  // Verificar si el bot es admin
  const botJid = conn.user.jid; // ej: '59898301727@s.whatsapp.net'
  const botParticipant = participants.find(p => p.id === botJid);
  if (!botParticipant || (botParticipant.admin !== 'admin' && botParticipant.admin !== 'superadmin')) {
    return conn.reply(m.chat, '⚠️ Necesito ser administrador para resetear el enlace.', m);
  }

  // Resetear enlace
  try {
    const code = await conn.groupRevokeInvite(m.chat);
    const newLink = `https://chat.whatsapp.com/${code}`;

    await conn.sendMessage(m.chat, {
      text: `✅ *Enlace de invitación reseteado correctamente*\n\nNuevo link del grupo:\n${newLink}`,
    });
  } catch (e) {
    console.error(e);
    conn.reply(m.chat, '❌ Error al intentar resetear el enlace. Verificá los permisos.', m);
  }
};

handler.help = ['resetlink'];
handler.tags = ['owner'];
handler.command = /^resetlink$/i;

export default handler;
