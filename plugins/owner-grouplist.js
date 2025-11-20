const handler = async (m, { conn }) => {
  let txt = '';

  try {
    const groups = Object.entries(conn.chats)
      .filter(([jid, chat]) => jid.endsWith('@g.us') && chat.isChats);

    const totalGroups = groups.length;
    const botJid = conn.decodeJid(conn.user.id);

    for (let i = 0; i < groups.length; i++) {
      const [jid] = groups[i];

      // Obtiene metadata
      const metadata = await conn.groupMetadata(jid).catch(() => null) || {};

      const participants = metadata.participants || [];

      // Lista REAL de admins
      const adminList = participants
        .filter(p => p.admin || p.role === 'admin' || p.role === 'superadmin')
        .map(p => conn.decodeJid(p.id));

      // Detecta admin correctamente
      const isBotAdmin = adminList.includes(botJid);

      // Detecta si el bot está en el grupo
      const isParticipant = participants.some(p => conn.decodeJid(p.id) === botJid);

      const link = isBotAdmin
        ? 'https://chat.whatsapp.com/' + (await conn.groupInviteCode(jid).catch(() => '--- (Error) ---'))
        : '--- (No admin) ---';

      txt += `*◉ Grupo ${i + 1}*
*➤ Nombre:* ${metadata.subject || '(Sin nombre)'}
*➤ ID:* ${jid}
*➤ Admin:* ${isBotAdmin ? '✔ Sí' : '❌ No'}
*➤ Estado:* ${isParticipant ? '👤 Participante' : '❌ Ex participante'}
*➤ Total Participantes:* ${participants.length}
*➤ Link:* ${link}

`;
    }

    return m.reply(
      `*Lista de grupos del Bot* 🤖\n\n` +
      `*—◉ Total de grupos:* ${totalGroups}\n\n${txt}`
    );

  } catch (e) {
    console.log('Error listgroup:', e);
    return m.reply('❌ Error al obtener la lista de grupos.');
  }
};

handler.help = ['groups', 'grouplist'];
handler.tags = ['owner'];
handler.command = ['listgroup', 'gruposlista', 'grouplist', 'listagrupos'];
handler.rowner = true;

export default handler;
