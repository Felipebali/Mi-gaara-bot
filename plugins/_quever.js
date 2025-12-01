import fetch from "node-fetch";

const generos = {
  accion: ["Terminator", "Mad Max Fury Road", "John Wick", "Die Hard", "Gladiator"],
  terror: ["The Conjuring", "Insidious", "Annabelle", "The Nun", "Hereditary"],
  comedia: ["Superbad", "The Mask", "Ted", "21 Jump Street", "The Hangover"],
  romance: ["The Notebook", "La La Land", "Titanic", "Pride and Prejudice", "About Time"],
  drama: ["The Shawshank Redemption", "Fight Club", "The Green Mile", "Joker", "Forrest Gump"],
  scifi: ["Interstellar", "The Matrix", "Inception", "Blade Runner 2049", "Arrival"]
};

let handler = async (m, { args }) => {
  if (!args[0]) {
    return m.reply(
      `🎬 *¿Qué género querés ver?*\n` +
      `Ejemplos:\n.quever accion\n.quever terror\n.quever comedia`
    );
  }

  const gen = args[0].toLowerCase();
  if (!generos[gen]) {
    return m.reply(`❌ Género no válido.\nGéneros disponibles:\n${Object.keys(generos).join(", ")}`);
  }

  m.reply(`🍿 Buscando pelis de *${gen}*...`);

  // Mezclar aleatoriamente
  const lista = generos[gen].sort(() => Math.random() - 0.5).slice(0, 5);
  let respuesta = `🎬 *Recomendaciones ${gen} (sin API key)*\n\n`;

  for (let titulo of lista) {
    try {
      const url = `https://www.omdbapi.com/?t=${encodeURIComponent(titulo)}&plot=short&apikey=none`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.Response === "False") continue;

      respuesta += `🎞️ *${data.Title}* (${data.Year})\n`;
      respuesta += `⭐ IMDB: ${data.imdbRating}\n`;
      respuesta += `📖 ${data.Plot}\n`;
      respuesta += `🔗 https://www.imdb.com/title/${data.imdbID}\n`;
      respuesta += `🖼️ Poster: ${data.Poster}\n\n`;

    } catch (e) {
      continue;
    }
  }

  return m.reply(respuesta);
};

handler.command = ["quever"];
export default handler;
