const handler = async (m, { conn, participants }) => {
  if (!m.isGroup) return m.reply('❗ Este comando solo funciona en grupos.');

  const sender = m.sender;
  const senderData = participants.find(p => p.id === sender);

  // ✅ Comprobamos si es admin o superadmin
  const isAdmin = senderData?.admin === 'admin' || senderData?.admin === 'superadmin';

  if (!isAdmin) {
    return m.reply('🚫 Solo los administradores pueden consultar las reglas del grupo.');
  }

  try {
    const groupMetadata = await conn.groupMetadata(m.chat);
    const descripcion = groupMetadata.desc || '❌ Este grupo no tiene reglas establecidas.';

    const frases = [
      '🪖 Todo soldado debe obedecer las reglas sin cuestionar.',
      '⚔️ La disciplina es la base del orden.',
      '💣 El caos será eliminado con precisión digital.',
      '📜 Las reglas son sagradas y deben cumplirse sin excepción.',
      '🔥 Quien rompa las reglas, conocerá la furia del comandante.'
    ];
    const fraseAleatoria = frases[Math.floor(Math.random() * frases.length)];

    const texto = `🎖️ *REGLAMENTO OFICIAL DEL GRUPO*\n\n${fraseAleatoria}\n\n📋 *REGLAS:*\n${descripcion}\n\n⚠️ *El incumplimiento será castigado con advertencias o fusilamiento digital.*`;

    await conn.sendMessage(m.chat, { text: texto });
  } catch (err) {
    console.error(err);
    m.reply('⚠️ No pude obtener las reglas. Asegúrate de que el bot sea administrador del grupo.');
  }
};

handler.command = ['reglas'];
handler.tags = ['group'];
handler.help = ['reglas'];
handler.admin = true;
handler.group = true;

export default handler;
