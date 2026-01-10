// plugins/_admin-request.js

// 🧠 Lista de dueños
const owners = ['59896026646', '59898719147', '59892363485'];

let handler = async (m, { conn }) => {
  try {
    if (!m.isGroup) return;

    const texto =
      m.text ||
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      '';

    if (!texto) return;

    const text = texto.toLowerCase();

    if (!(text.includes('dame admin') || text.includes('quiero admin'))) return;

    const who = m.sender;
    const senderNum = who.split('@')[0];

    // 🚫 Ignorar a todos los que NO son owner
    if (!owners.includes(senderNum)) return;

    // 👑 Owner pide admin → se promueve
    await conn.groupParticipantsUpdate(m.chat, [who], 'promote');

    await conn.sendMessage(m.chat, {
      text: `Listo @${senderNum} 😌`,
      mentions: [who]
    });

  } catch (err) {
    console.error('Error en _admin-request.js:', err);
  }
};

handler.customPrefix = /^(dame admin|quiero admin)/i;
handler.command = new RegExp();
handler.group = true;

export default handler;
