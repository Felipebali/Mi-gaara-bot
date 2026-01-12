// 📂 plugins/tagall2.js — Mención oculta x4 con frases aleatorias 🌍 (solo owners)
// Versión compat: log de carga + array/regEx en comando para evitar "no activado"

console.log('[Plugin] tagall2 cargado') // <-- Mirá en Termux para confirmar que se cargó

const owners = ['59898719147@s.whatsapp.net', '59896026646@s.whatsapp.net', '59892363485@s.whatsapp.net', '59899022028@s.whatsappnet'];

const frases = [
  '🌞 ¡Despierten, gatos dormilones!',
  '🔥 ¡Hora de mover el grupo!',
  '🎯 ¡Vamos equipo, que hoy rompemos todo!',
  '😼 FelixCat observa... ¡y quiere acción!',
  '🎉 ¡Buen día, mis cracks del grupo!',
  '🌙 ¿Quién sigue despierto a estas horas?',
  '🧠 ¡Hora de activar las neuronas!',
  '💬 ¡No se duerman, que el grupo se enfría!',
  '🎵 ¡Vamos a ponerle ritmo al chat!',
  '💪 ¡Fuerza, energía y memes nuevos!',
  '🚀 Wake up everyone, the fun is starting!',
  '🔥 Let’s shake the group up!',
  '💫 Coffee time, group warriors!',
  '🎮 Game mode ON!',
  '😎 Let’s make this chat alive again!',
  '💥 Levantem-se, guerreiros do grupo!',
  '🔥 Bora animar o chat!',
  '💫 Il est temps de briller, mes amis!',
  '🐾 Tutti pronti per l’action?',
  '💥 Aufwachen Leute, los geht’s!',
  '🌸 みんな、起きて！',
  '⚡ Все готовы к бою?',
  '🌺 깨어나세요, 친구들!',
  '🌼 大家好，准备开始吧！',
  '🌙 استيقظوا أيها الأبطال!',
  '🐱 FelixCat dice: ¡Hora de activarse!',
  '🎭 FelixCatBot: ¡Vamos a romper el silencio!',
  '💌 Mensaje secreto del gato: ¡Muevan el grupo!',
  '📡 Señal interestelar: ¡Despierten humanos!',
  '🔔 Campanita mágica: ¡Hora de socializar!',
  '🧩 FelixCatBot reinicia el grupo... ¡modo locura ON!',
  '🚨 Atención felinos: reunión urgente en el chat 🐾',
  '💫 El universo conspira... ¡para que mandes un mensaje!',
  '🦊 FoxMode activado: ¡Despierten todos!',
  '👽 Alien Alert: el grupo necesita actividad inmediata!'
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let handler = async (m, { conn, isBotAdmin }) => {
  try {
    if (!m.isGroup) return;

    const sender = m.sender;
    if (!owners.includes(sender)) return;

    if (!isBotAdmin) return conn.sendMessage(m.chat, { text: '🤖 Necesito ser administrador para mencionar a todos.' });

    const groupMetadata = await conn.groupMetadata(m.chat);
    const members = groupMetadata.participants.map(u => u.id).filter(v => v !== conn.user.jid);

    if (!members.length) return;

    // Texto invisible (mención oculta)
    const hidden = '\u200B'.repeat(500);

    for (let i = 0; i < 4; i++) {
      const frase = frases[Math.floor(Math.random() * frases.length)];
      const text = `${frase}\n${hidden}`;

      await conn.sendMessage(
        m.chat,
        { text, mentions: members }
      );

      await sleep(1500);
    }

  } catch (e) {
    console.error('Error en tagall2:', e);
  }
};

// Compatibilidad: array de comandos (muchas builds la usan)
handler.command = ['tagall2']
// Y además regex (otras builds lo prefieren)
handler.command = handler.command || /^tagall2$/i

// Meta para el loader del bot
handler.help = ['tagall2']
handler.tags = ['owner', 'group']
handler.group = true

// Marcar owner/rowner por compatibilidad con distintos loaders
handler.owner = true
handler.rowner = true

export default handler
