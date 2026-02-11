const text =
  m.text ||
  m.message.conversation ||
  m.message.extendedTextMessage?.text ||
  m.message.caption ||
  "";

if (!text) return true;

// 🚫 SOLO ESTE LINK
const blockedExactLink = "https://www.instagram.com/nachorsp?igsh=MXBmNG9xemI0OTh3Zw==";

if (text.includes(blockedExactLink)) {
  await conn.sendMessage(m.chat, {
    delete: {
      remoteJid: m.chat,
      fromMe: false,
      id: m.key.id,
      participant: m.key.participant || m.sender,
    },
  });

  return false;
}
