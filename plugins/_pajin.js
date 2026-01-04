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

    // NÚMERO ESPECIAL VIP
    const VIP_NUMBER = '59898116138'; // sin + ni @c.us

    // -----------------------------------------
    // DECIDIR si es .pajin o .pajin2
    const isPajin2 = handler.command.includes('pajin2');

    // 🎲 Selección aleatoria de usuarios distintos
    const others = participants.map(p => p.id).filter(jid => jid !== who && jid !== conn.user.jid);

    if (others.length === 0) return conn.sendMessage(m.chat, { text: '❌ No hay usuarios suficientes para hacer travesuras 😏' });

    let user1 = others[Math.floor(Math.random() * others.length)];
    let user2;
    do {
      user2 = others[Math.floor(Math.random() * others.length)];
    } while (user2 === user1 && others.length > 1);

    const user1Name = '@' + user1.split('@')[0];
    const user2Name = '@' + user2.split('@')[0];

    let frase;

    if (isPajin2 || who.includes(VIP_NUMBER)) {
      // Mensaje especial VIP
      const frasesVIP = [
        `🌟 ¡Alerta VIP! ${senderName} está haciendo travesuras secretas con ${user1Name} y ${user2Name} 😏✨`,
        `😎 ${senderName} desata su modo pajero VIP con ${user1Name} y ${user2Name} 🫣🔥`,
        `💫 ¡Exclusivo! ${senderName} se confiesa travieso con ${user1Name} y ${user2Name} 😈`
      ];
      frase = frasesVIP[Math.floor(Math.random() * frasesVIP.length)];
    } else {
      // Mensajes normales
      const frasesNormales = [
        `😏 ${senderName} está haciendo cosas de pajero con ${user1Name} y ${user2Name} 🤭`,
        `😂 ${senderName} no puede resistirse a pensar en cosas traviesas sobre ${user1Name} y ${user2Name} 😳`,
        `😎 ${senderName} está en modo pajero total con ${user1Name} y ${user2Name} 😈`,
        `🤣 ${senderName} tiene pensamientos muy traviesos sobre ${user1Name} y ${user2Name} 😏`,
        `😅 ${senderName} confiesa que está haciendo cosas de pajero con ${user1Name} y ${user2Name} 🤫`
      ];
      frase = frasesNormales[Math.floor(Math.random() * frasesNormales.length)];
    }

    // 🧾 Mensaje final con menciones clickeables
    await conn.sendMessage(
      m.chat,
      { text: frase, mentions: [who, user1, user2] },
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
