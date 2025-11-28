export function setupWelcomeBye(conn) {
  conn.ev.on('group-participants.update', async (update) => {
    try {
      console.log('Update recibido:', update);

      const { id, participants, action } = update;

      if (!participants || participants.length === 0) return;

      const groupMetadata = await conn.groupMetadata(id);
      const groupName = groupMetadata.subject;

      for (const participant of participants) {
        const username = participant.split('@')[0];

        if (action === 'add') {
          const welcomeMessage = `🎉 ¡Bienvenido/a @${username} al grupo *${groupName}*! Disfruta tu estadía.`;
          await conn.sendMessage(id, { 
            text: welcomeMessage, 
            mentions: [participant] 
          });
        }

        if (action === 'remove') {
          const byeMessage = `😢 @${username} ha salido del grupo *${groupName}*.`;
          await conn.sendMessage(id, { 
            text: byeMessage, 
            mentions: [participant] 
          });
        }
      }
    } catch (err) {
      console.error('Error en plugin bienvenida/despedida:', err);
    }
  });
}
