// 📂 plugins/pajin.js
let handler = async (m, { conn, participants }) => {
  try {
    const chat = global.db.data.chats[m.chat] || {};
    const gamesEnabled = chat.games !== false;

    if (!gamesEnabled) {  
      return conn.sendMessage(m.chat, {  
        text: '🎮 *Los mini-juegos están desactivados en este grupo.*\n\nActívalos con *.juegos* 🔓',  
      });  
    }  

    if (!participants || participants.length < 2) {  
      return conn.sendMessage(m.chat, { text: '👥 Se necesitan al menos *2 personas* en el grupo para usar .pajin.' });  
    }  

    const who = m.sender;
    const senderName = '@' + who.split('@')[0];

    // Número VIP para pajin2
    const VIP_NUMBER = '59898116138'; // sin + ni @c.us
    const isPajin2 = handler.command.includes('pajin2');

    let frase;
    let mentions = [];

    if (isPajin2) {
      if (who.includes(VIP_NUMBER)) {
        // Frases VIP para el número especial
        const frasesVIP = [
          `🌟 ${senderName}, tu nivel travieso VIP está en 🔥 Máximo absoluto 😈💦`,
          `😎 ${senderName}, nadie se salva de tu lado pajero VIP 😏💫`,
          `💫 ¡Cuidado! ${senderName} está desatando su modo travieso supremo 😈✨`,
          `🔥 ${senderName} domina el arte de las travesuras VIP 😏🫣`,
          `💥 Atención grupo: ${senderName} activa su poder pajero nivel legendario 😎💦`
        ];
        frase = frasesVIP[Math.floor(Math.random() * frasesVIP.length)];
        mentions = [who]; // Solo se menciona él
      } else {
        // Si otro usa .pajin2, no responde
        return;
      }
    } else {
      // .pajin normal con 2 usuarios aleatorios
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
        `😏 ${user1Name} y ${user2Name} acaban de entrar al modo travieso extremo 🤭🔥`,
        `😂 ¡Qué duo! ${user1Name} y ${user2Name} desatan sus fantasías más locas 😳💥`,
        `😎 Atención: ${user1Name} y ${user2Name} dominan el arte del pijin total 😈💦`,
        `🤣 Mirá lo que hacen ${user1Name} y ${user2Name}, nivel travieso insuperable 😏💫`,
        `💥 Confesión traviesa: ${user1Name} y ${user2Name} rompen todas las reglas 😈😎`
      ];
      frase = frasesNormales[Math.floor(Math.random() * frasesNormales.length)];
      mentions = [user1, user2]; // Solo los aleatorios
    }

    // 🧾 Enviar mensaje SIN reply
    await conn.sendMessage(m.chat, { text: frase, mentions });

  } catch (e) {
    console.error(e);
    // El error se ignora silenciosamente
  }
}

handler.command = ['pajin', 'pajero', 'pajin2'];
handler.tags = ['fun', 'nsfw'];
handler.help = ['pajin', 'pajin2'];
handler.group = true;

export default handler;
