// 📂 plugins/pajin.js
let handler = async (m, { conn, participants }) => {
  try {
    const chat = global.db.data.chats[m.chat] || {};
    const gamesEnabled = chat.games !== false; // Activados por defecto

    if (!gamesEnabled) {  
      return conn.sendMessage(m.chat, {  
        text: '🎮 *Los mini-juegos están desactivados en este grupo.*\n\nActívalos con *.juegos* 🔓',  
      });  
    }  

    if (!participants || participants.length < 2) {  
      return conn.sendMessage(m.chat, { text: '👥 Se necesitan al menos *2 personas* en el grupo para usar .pajin.' });  
    }  

    let who = m.sender;
    const senderName = '@' + who.split('@')[0];

    // NÚMERO VIP especial para pajin2
    const VIP_NUMBER = '59898116138'; // sin + ni @c.us

    // -----------------------------------------
    // DECIDIR si es .pajin2
    const isPajin2 = handler.command.includes('pajin2');

    let frase;
    let mentions = [];

    if (isPajin2 && who.includes(VIP_NUMBER)) {
      // Mensaje especial solo para él
      const frasesVIP = [
        `🌟 ${senderName}, estás en modo travieso VIP 😏✨`,
        `😎 ${senderName}, nadie puede resistir tu modo pajero VIP 😈🔥`,
        `💫 ¡Exclusivo! ${senderName}, confesión traviesa activada 😈`
      ];
      frase = frasesVIP[Math.floor(Math.random() * frasesVIP.length)];
      mentions = [who]; // Solo se menciona a él
    } else {
      // Mensaje normal, elegir 2 usuarios aleatorios del grupo
      const others = participants.map(p => p.id).filter(jid => jid !== who && jid !== conn.user.jid);
      if (others.length < 2) return conn.sendMessage(m.chat, { text: '❌ No hay suficientes usuarios para hacer travesuras 😏' });

      let user1 = others[Math.floor(Math.random() * others.length)];
      let user2;
      do {
        user2 = others[Math.floor(Math.random() * others.length)];
      } while (user2 === user1);

      const user1Name = '@' + user1.split('@')[0];
      const user2Name = '@' + user2.split('@')[0];

      const frasesNormales = [
        `😏 ${user1Name} y ${user2Name} están en modo pajero 🤭`,
        `😂 Estos dos traviesos: ${user1Name} y ${user2Name} 😳`,
        `😎 ${user1Name} y ${user2Name} hacen cosas traviesas 😈`,
        `🤣 Mirá lo que hacen ${user1Name} y ${user2Name} 😏`,
        `😅 Confesión traviesa: ${user1Name} y ${user2Name} 🤫`
      ];
      frase = frasesNormales[Math.floor(Math.random() * frasesNormales.length)];
      mentions = [user1, user2]; // Solo se mencionan los aleatorios
    }

    // 🧾 Enviar mensaje
    await conn.sendMessage(
      m.chat,
      { text: frase, mentions },
      { quoted: m }
    );

  } catch (e) {
    console.error(e);
    await conn.reply(m.chat, '✖️ Ocurrió un error al ejecutar el comando', m);
  }
}

// Definir comandos
handler.command = ['pajin', 'pajero', 'pajin2'];
handler.tags = ['fun', 'nsfw'];
handler.help = ['pajin', 'pajin2'];
handler.group = true;

export default handler;
