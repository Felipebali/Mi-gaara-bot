// 📂 plugins/owner-resetlink.js
let handler = async (m, { conn, participants }) => {
  // 🔒 Dueños autorizados
  const owners = ['59896026646', '59898719147', '59892363485'];
  const sender = m.sender.replace(/[^0-9]/g, '');

  // ❌ Solo dueños
  if (!owners.includes(sender)) {
    return conn.reply(m.chat, '🚫 Este comando solo puede usarlo mi creador.', m);
  }

  // ❌ Solo en grupos
  if (!m.isGroup) {
    return conn.reply(m.chat, '❌ Este comando solo se puede usar en grupos.', m);
  }

  // 🔍 Detectar al bot dentro de los participantes
  const botNumber = conn.user.jid.split('@')[0];
  const botParticipant = participants.find(p => p.id.startsWith(botNumber));

  // ❌ Verificar si el bot es admin
  if (!botParticipant || (botParticipant.admin !== 'admin' && botParticipant.admin !== 'superadmin')) {
    console.log("Debug participantes:", participants.map(p => ({ id: p.id, admin: p.admin })));
    console.log("Bot participante:", botParticipant);
    return conn.reply(m.chat, '⚠️ Necesito ser administrador para resetear el enlace.', m);
  }

  // ✅ Resetear enlace
  try {
    const code = await conn.groupRevokeInvite(m.chat);
    const newLink = `https://chat.whatsapp.com/${code}`;

    await conn.sendMessage(m.chat, {
      text: `✅ *Enlace de invitación reseteado correctamente*\n\nNuevo link del grupo:\n${newLink}`,
    });
  } catch (e) {
    console.error(e);
    return conn.reply(m.chat, '❌ Error al intentar resetear el enlace. Verificá los permisos.', m);
  }
};

handler.help = ['resetlink'];
handler.tags = ['owner'];
handler.command = /^resetlink$/i;

export default handler;
