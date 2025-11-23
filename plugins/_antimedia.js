// 📂 plugins/grupos-antiMedia.js — FelixCat_Bot 🐾
// Elimina solo fotos e imágenes (imageMessage) y videos (videoMessage).

const owners = ["59896026646@s.whatsapp.net", "59898719147@s.whatsapp.net"];

let handler = async (m, { conn, isOwner }) => {

  const chat = global.db.data.chats[m.chat] || {};

  chat.antiMedia = !chat.antiMedia;
  global.db.data.chats[m.chat] = chat;

  await conn.sendMessage(m.chat, { 
    text: `🖼️ *Anti Fotos/Videos* fue *${chat.antiMedia ? "activado" : "desactivado"}*.\n\n🔹 Cuando está activado, el bot elimina solo imágenes y videos automáticamente.` 
  });
};

handler.help = ["antimedia"];
handler.tags = ["grupo"];
handler.command = /^antimedia$/i; // 👈 AHORA EL COMANDO FUNCIONA

export default handler;


// ==========================================
//        AUTO-ELIMINAR FOTOS Y VIDEOS
// ==========================================
export async function before(m, { conn, isBotAdmin }) {

  const chat = global.db.data.chats[m.chat];
  if (!chat?.antiMedia) return;
  if (!m.isGroup) return;
  if (!isBotAdmin) return;

  // Detectar solo IMAGEN o VIDEO
  const isPhotoOrVideo =
    m.mtype === "imageMessage" ||
    m.mtype === "videoMessage";

  if (!isPhotoOrVideo) return;

  try {
    await conn.sendMessage(m.chat, {
      delete: {
        id: m.key.id,
        remoteJid: m.chat,
        fromMe: false,
        participant: m.sender
      }
    });

  } catch (e) {
    console.log("❌ Error borrando foto/video:", e);
  }

  return;
}
