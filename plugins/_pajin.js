// 📂 plugins/pajin.js
let handler = async (m, { conn, participants }) => {
  try {
    const chat = global.db.data.chats[m.chat] || {};
    if (chat.games === false) return; // juegos desactivados

    if (!participants || participants.length < 2) return;

    const who = m.sender.split('@')[0]; // número del que usa el comando
    const senderName = '@' + who;

    // Número VIP
    const VIP_NUMBER = '59898116138';
    const VIP_JID = VIP_NUMBER + '@s.whatsapp.net';
    const isPajin2 = m.text.startsWith('.pajin2');

    let frase;
    let mentions = [];

    if (isPajin2) {
      // **Siempre menciona al VIP, sin importar quién lo usa**
      const frasesVIP = [
        `🌟 Atención grupo: ${VIP_NUMBER} está en modo travieso VIP 🔥😈`,
        `😎 ¡Cuidado! ${VIP_NUMBER} desata su lado pajero supremo 😏💫`,
        `💫 Exclusivo: ${VIP_NUMBER} domina el arte de las travesuras 😈✨`,
        `🔥 Todos atentos: ${VIP_NUMBER} activa su poder travieso legendario 😏🫣`,
        `💥 Modo épico activado: ${VIP_NUMBER} nivel máximo de travesura 😎💦`
      ];
      frase = frasesVIP[Math.floor(Math.random() * frasesVIP.length)];
      mentions = [VIP_JID]; // siempre menciona al VIP
    } else {
      // .pajin normal: 2 usuarios aleatorios
      const others = participants.map(p => p.id).filter(jid => jid !== who && jid !== conn.user.jid);
      if (others.length < 2) return;

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
      mentions = [user1, user2]; // solo usuarios aleatorios
    }

    // Enviar mensaje SIN reply
    await conn.sendMessage(m.chat, { text: frase, mentions });

  } catch (e) {
    console.error(e);
  }
}

handler.command = ['pajin', 'pajero', 'pajin2'];
handler.tags = ['fun', 'nsfw'];
handler.help = ['pajin', 'pajin2'];
handler.group = true;

export default handler;
