// 🧹 Auto salida del bot si no es administrador

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let plugin = (m) => m;

plugin.before = async function (m, { client, isBotAdmin }) {
  if (!m.isGroup) return;

  // Si el bot no es admin → se va del grupo
  if (!isBotAdmin) {
    try {
      await client.sendText(
        m.chat,
        "🚫 *El bot necesita ser administrador para funcionar correctamente.*\n\n👋 Saliendo del grupo..."
      );
      await delay(1500);
      await client.groupLeave(m.chat);
    } catch (e) {
      console.error("Error al salir del grupo:", e);
    }
  }

  return;
};

export default plugin; 
