// 📌 AntiCanal — Funciona en todos los tipos de mensaje

// Detecta CUALQUIER link de canal, incluso con parámetros
const canalRegex = /whatsapp\.com\/channel\/[0-9A-Za-z]+/i;

// Si querés que los dueños no sean detectados, ponelos acá
const owners = ["59896026646", "59898719147"];

function cleanNum(jid) {
  return jid.replace(/\D/g, "");
}

let handler = async (m, { conn, command, isAdmin }) => {

  if (command === "anticanal") {

    if (!m.isGroup) return m.reply("❌ Solo funciona en grupos.");
    if (!isAdmin) return m.reply("❌ Solo admins pueden usar este comando.");

    if (!global.db.data.chats[m.chat])
      global.db.data.chats[m.chat] = {};

    let chat = global.db.data.chats[m.chat];
    chat.anticanal = !chat.anticanal;

    return m.reply(`🔰 AntiCanal *${chat.anticanal ? "ACTIVADO" : "DESACTIVADO"}*`);
  }
};

export async function before(m, { conn }) {

  if (!m.isGroup) return;

  const chat = global.db.data.chats[m.chat];
  if (!chat || !chat.anticanal) return;

  // ---------------------------
  // EXTRAER TEXTO REAL DEL MENSAJE
  // ---------------------------
  const texto =
    m.text ||
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    m.message?.extendedTextMessage?.canonicalUrl ||
    m.message?.extendedTextMessage?.matchedText ||
    m.message?.buttonsResponseMessage?.selectedButtonId ||
    m.message?.listResponseMessage?.title ||
    m.message?.interactiveResponseMessage?.body?.text ||
    "";

  // ---------------------------
  // IGNORAR DUEÑOS
  // ---------------------------
  const sender = cleanNum(m.sender);
  if (owners.includes(sender)) return;

  // ---------------------------
  // DETECTAR LINK DE CANAL
  // ---------------------------
  if (canalRegex.test(texto)) {

    try {
      // BORRAR EL MENSAJE
      await conn.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          fromMe: false,
          id: m.key.id,
          participant: m.key.participant || m.sender
        }
      });
    } catch (e) {
      console.log("Error borrando:", e);
    }

    // NOTIFICAR
    await conn.sendMessage(m.chat, {
      text: `🚫 *Enlace a canal eliminado*\n@${sender}`,
      mentions: [m.sender]
    });

  }
}

handler.command = ["anticanal"];
export default handler;
