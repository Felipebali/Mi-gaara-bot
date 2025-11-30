// 📂 plugins/reaccion-admin.js
// Reacciona automáticamente con 🤣🤣 cuando alguien diga "admin"

let handler = async (m, { conn }) => {
  try {
    if (!m.text) return;

    // Detectar palabra admin (sin importar mayúsculas)
    if (/^(admin|admins)$/i.test(m.text.trim())) {
      await conn.sendMessage(m.chat, {
        react: {
          text: "🤣🤣",
          key: m.key
        }
      });
    }

  } catch (e) {
    console.error('Error en reaccion-admin:', e);
  }
};

export default handler;
