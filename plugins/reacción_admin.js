// 📂 plugins/reaccion-admin.js
// Reacciona automáticamente con 🤣🤣 cuando alguien diga "admin"

let handler = m => m;

handler.before = async (m, { conn }) => {

  if (!m.text) return;

  // Detectar "admin" en cualquier parte del mensaje
  if (/admin/i.test(m.text)) {
    try {
      await conn.sendMessage(m.chat, {
        react: {
          text: "🤣🤣",
          key: m.key
        }
      });
    } catch (e) {
      console.error("Error en reaccion-admin:", e);
    }
  }

};

export default handler;
