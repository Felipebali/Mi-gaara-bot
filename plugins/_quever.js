import fetch from "node-fetch";

const generos = {
  accion: ["Terminator", "John Wick", "Mad Max", "The Bourne Ultimatum", "Taken"],
  terror: ["The Conjuring", "Hereditary", "Insidious", "The Exorcist", "The Ring"],
  comedia: ["Superbad", "Ted", "The Mask", "21 Jump Street", "Step Brothers"],
  romance: ["The Notebook", "Titanic", "La La Land", "500 Days of Summer", "About Time"],
  drama: ["Fight Club", "Forrest Gump", "The Green Mile", "Whiplash", "The Pursuit of Happyness"],
  scifi: ["Interstellar", "Inception", "The Matrix", "Arrival", "Blade Runner 2049"]
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

  m.reply(`🍿 Buscando recomendaciones de *${gen}*...`);

  const lista = generos[gen].sort(() => Math.random() - 0.5).slice(0, 5);
  let resultado = `🎬 *Recomendaciones ${gen}*\n\n`;

  for (let titulo of lista) {
    try {
      const url = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(titulo)}`;
      const res = await fetch(url);
      const json = await res.json();

      if (!json || !json[0] || !json[0].show) continue;

      const show = json[0].show;

      resultado += `🎞️ *${show.name}* (${show.premiered ? show.premiered.slice(0,4) : "?"})\n`;
      resultado += `📖 ${show.summary ? show.summary.replace(/<[^>]+>/g, "") : "Sin descripción"}\n`;
      resultado += `🔗 ${show.url}\n`;
      resultado += `🖼️ Poster: ${show.image?.original || "No disponible"}\n\n`;

    } catch (e) {
      continue;
    }
  }

  return m.reply(resultado);
};

handler.command = ["quever"];
export default handler;
