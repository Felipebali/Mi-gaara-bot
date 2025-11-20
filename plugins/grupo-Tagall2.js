// plugins/tagallT.js
// Activador: letra "T" o "t" (sin prefijo)
// SOLO DUEÑOS ESPECÍFICOS pueden activarlo
// Mención visible a un usuario al azar + mención oculta al resto

const OWNERS = ['59896026646@s.whatsapp.net', '59898719147@s.whatsapp.net']; // Tus owners

let handler = async (m, { conn, groupMetadata }) => {
  try {
    if (!m.isGroup) return; // Solo grupos

    const sender = m.sender || m.key?.participant;
    if (!OWNERS.includes(sender)) return; // Ignorar todos los demás

    const texto = (m.text || '').trim();
    if (!texto || texto.toLowerCase() !== 't') return; // Activador: T o t

    const participantes = (groupMetadata?.participants || [])
      .map(p => (conn.decodeJid ? conn.decodeJid(p.id) : p.id))
      .filter(Boolean);

    if (participantes.length < 2) return;

    const usuarioAzar = participantes[Math.floor(Math.random() * participantes.length)];
    const mencionesOcultas = participantes.filter(u => u !== usuarioAzar);

    const frases = [
      `📢 Parece que @${usuarioAzar.split('@')[0]} quiso asegurarse de que nadie se quede dormido 😴`,
      `👀 @${usuarioAzar.split('@')[0]} tocó la letra mágica... y ahora todos fueron notificados 💬`,
      `💡 @${usuarioAzar.split('@')[0]} pensó que sería buena idea avisar a todos 😅`,
      `⚡ @${usuarioAzar.split('@')[0]} activó el modo “presente o expulsado” 😆`,
      `🔥 @${usuarioAzar.split('@')[0]} encendió el grupo con una sola letra 😎`,
      `😂 Todo indica que @${usuarioAzar.split('@')[0]} tenía ganas de charlar con todos 📲`,
    ];

    const mensaje = frases[Math.floor(Math.random() * frases.length)];

    await conn.sendMessage(m.chat, {
      text: mensaje,
      mentions: [usuarioAzar, ...mencionesOcultas]
    });

  } catch (err) {
    console.error('tagallT error:', err);
  }
};

// Detecta "T" o "t" sin prefijo
handler.customPrefix = /^\s*t\s*$/i;
handler.command = [''];
handler.group = true;

export default handler;
