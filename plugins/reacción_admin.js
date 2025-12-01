// 📂 plugins/chao-frases.js
// Respuestas de texto mencionando al usuario cuando dice "chau", "chao", "adiós", "bye", etc.

let handler = m => m;

handler.before = async (m, { conn }) => {

  if (!m.text) return;

  // Palabras clave
  if (/\b(chau|chao|adios|adiós|bye|me voy)\b/i.test(m.text)) {

    const user = '@' + m.sender.split('@')[0];

    // Lista amplia de frases con mención
    const frases = [
      `¡Chau ${user}! 🌟 Que tengas un día genial 👋😄`,
      `¡Nos vemos ${user}! 👋✨`,
      `¡Cuídate mucho ${user}! 💛`,
      `Hasta la próxima crack ${user} 😎🔥`,
      `¡Adiós ${user}! Que todo te salga bien ☀️`,
      `¡Bye ${user}! No te olvides de volver 😄`,
      `Bueno… chau pues ${user} 👋😂`,
      `Ta’ luegoooo ${user} 🐾`,
      `Cuidate máquina ${user} 💪🔥`,
      `¡Chau ${user}! Fue un gusto ✨`,
      `Adiós ${user}, persona maravillosa 😎`,
      `Nos vemos en otra aventura ${user} 🧭😄`,
      `Chauuu ${user}, andá a hidratarte 💧😂`,
      `Que el universo te acompañe ${user} ✨🌌`,
      `Hasta pronto ${user}, no me extrañes mucho 😉`,
      `Bye ${user}, que descanses 😴🌙`,
      `Cuidate ${user}, portate bien 😄`,
      `Nos vemos en la próxima conexión ${user} ⚡`,
      `Chauuu ${user}, no desaparezcas tanto 👀`,
      `Bye bye ${user}, sos grande 🌟`
    ];

    // Elegir frase random
    const frase = frases[Math.floor(Math.random() * frases.length)];

    try {
      await conn.sendMessage(m.chat, { 
        text: frase,
        mentions: [m.sender]
      });
    } catch (e) {
      console.error("Error en chao-frases:", e);
    }
  }

};

export default handler;
