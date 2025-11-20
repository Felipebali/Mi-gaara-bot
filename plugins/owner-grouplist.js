const handler = async (m, { conn }) => {
  let txt = '';

  try {
    const groups = Object.entries(conn.chats)
      .filter(([jid, chat]) => jid.endsWith('@g.us') && chat.isChats);

    const totalGroups = groups.length;

    for (let i = 0; i < groups.length; i++) {
      const [jid] = groups[i];

      // Obtiene metadata real
      const metadata = await conn.groupMetadata(jid).catch(() => null) || {};
      const participants = metadata.participants || [];

      // Encuentra al bot dentro de los participantes
      const botJid = conn.decodeJid(conn.user.id);
      const bot = participants.find(p => conn.decodeJid(p.id) === botJid);

      // Verifica admin correctamente
      const isBotAdmin = bot && (bot.admin === 'admin' || bot.admin === 'superadmin');

      // El bot está en el grupo?
      const isParticipant = Boolean(bot);

      txt += `*◉ Grupo ${i + 1}*
*➤ Nombre:* ${metadata.subject || '(Sin nombre)'}
*➤ ID:* ${jid}
*➤ Admin:* ${isBotAdmin ? '✔ Sí' : '❌ No'}
*➤ Estado:* ${isParticipant ? '👤 Participante' : '❌ Ex participante'}
*➤ Total de Participantes:* ${participants.length}
*➤ Link:* ${isBotAdmin ? 'https://chat.whatsapp.com/' + (await conn.groupInviteCode(jid).catch(() => '--- (Error) ---')) : '--- (No admin) ---'}

`;
    }

    return m.reply(
      `*Lista de grupos del Bot* 🤖\n\n` +
      `*—◉ Total de grupos:* ${totalGroups}\n\n${txt}`
    );

  } catch (e) {
    console.log('Error en listgroup:', e);
    return m.reply('❌ Ocurrió un error obteniendo la lista de grupos.');
  }
};

handler.help = ['groups', 'grouplist'];
handler.tags = ['owner'];
handler.command = ['listgroup', 'gruposlista', 'grouplist', 'listagrupos'];
handler.rowner = true;

export default handler;
