// plugins/tagallT.js
// Activador: letra "T" o "t" (sin prefijo)
// SOLO OWNER puede activarlo
// Mención visible a un usuario al azar + mención oculta al resto

let handler = async (m, { conn, groupMetadata, isOwner }) => {
  try {
    if (!m.isGroup) return; // Solo grupos
    if (!isOwner) return;   // ❗ SÓLO OWNER PUEDE ACTIVARLO

    const texto = (m.text || '').trim();
    if (!texto || texto.toLowerCase() !== 't') return; // Activador: T o t

    const participantes = (groupMetadata?.participants || [])
      .map(p => (conn.decodeJid ? conn.decodeJid(p.id) : p.id))
      .filter(Boolean);

    if (participantes.length < 2) {
      return conn.sendMessage(m.chat, { text: '❌ No hay suficientes miembros detectables.' });
    }

    const usuarioAzar = participantes[Math.floor(Math.random() * participantes.length)];
    const mencionesOcultas = participantes.filter(u => u !== usuarioAzar);

    const frases = [
      `📢 Parece que @${usuarioAzar.split('@')[0]} quiso asegurarse de que nadie se quede dormido 😴`,
      `👀 @${usuarioAzar.split('@')[0]} tocó la letra mágica... y ahora todos fueron notificados 💬`,
      `💡 @${usuarioAzar.split('@')[0]} pensó que sería buena idea avisar a todos 😅`,
      `⚡ @${usuarioAzar.split('@')[0]} activó el modo “presente o expulsado” 😆`,
      `🔥 @${usuarioAzar.split('@')[0]} encendió el grupo con una sola letra 😎`,
      `😂 Todo indica que @${usuarioAzar.split('@')[0]} tenía ganas de charlar con todos 📲`,
      `📣 @${usuarioAzar.split('@')[0]} convocó reunión de emergencia sin previo aviso 😬`,
      `😏 @${usuarioAzar.split('@')[0]} soltó la T y ahora nadie se salva de las notificaciones 💥`,
      `🫢 Alguien diga algo... @${usuarioAzar.split('@')[0]} acaba de despertar el grupo 👋`,
      `😄 @${usuarioAzar.split('@')[0]} quiso probar si la T funcionaba... y vaya si funcionó 🚀`,
    ];

    const mensaje = frases[Math.floor(Math.random() * frases.length)];

    await conn.sendMessage(m.chat, {
      text: mensaje,
      mentions: [usuarioAzar, ...mencionesOcultas]
    });

  } catch (err) {
    console.error('tagallT error:', err);
    conn.sendMessage(m.chat, { text: '❌ Ocurrió un error al ejecutar T.' });
  }
};

// Detecta "T" o "t" sin prefijo
handler.customPrefix = /^\s*t\s*$/i;
handler.command = [''];
handler.group = true;
// 🔒 SOLO OWNER
handler.owner = true;

export default handler;
