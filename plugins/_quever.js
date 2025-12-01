// plugins/quever.js
// Recomendador de películas SIN API KEY
// Fuente: https://api-movies-v1.vercel.app (pública)

import fetch from "node-fetch";

// Mapa de géneros
const genres = {
  accion: "Action",
  terror: "Horror",
  comedia: "Comedy",
  drama: "Drama",
  romance: "Romance",
  animacion: "Animation",
  aventura: "Adventure",
  fantasia: "Fantasy",
  crimen: "Crime",
  documental: "Documentary",
  familia: "Family",
  scifi: "Science Fiction"
};

let handler = async (m, { args }) => {
  if (!args[0]) {
    return m.reply(
      `🎬 *¿Qué género querés ver Feli?*\n\nEjemplos:\n` +
      `.quever accion\n.quever terror\n.quever comedia`
    );
  }

  const userGen = args[0].toLowerCase();
  const genre = genres[userGen];

  if (!genre) {
    return m.reply(`❌ Género no válido.\nGéneros disponibles:\n${Object.keys(genres).join(", ")}`);
  }

  await m.reply(`🍿 Buscando películas *${userGen}*...`)

  try {
    // Endpoint sin API KEY
    const url = "https://api-movies-v1.vercel.app/movies";

    const res = await fetch(url);
    const data = await res.json();

    if (!data || !Array.isArray(data)) {
      return m.reply("⚠️ No pude obtener películas ahora.");
    }

    // Filtrar por género
    let list = data.filter(mov =>
      mov.genre_ids_text?.some(g => g.toLowerCase().includes(genre.toLowerCase()))
    );

    if (list.length === 0) {
      return m.reply("😕 No encontré pelis de ese género, probá otro.");
    }

    // Mezclar y tomar 10
    list = list.sort(() => Math.random() - 0.5).slice(0, 10);

    // Construir mensaje
    let msg = `🎬 *QueVer: ${userGen}*\nAquí van 10 pelis:\n\n`;

    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      msg += `*${i + 1}. ${p.title}* (${p.release_date?.split("-")[0]})\n`;
      msg += `📝 ${p.overview || "Sin descripción"}\n`;
      msg += `🔗 https://www.themoviedb.org/movie/${p.id}\n\n`;
    }

    await m.reply(msg);

  } catch (e) {
    console.log(e);
    m.reply("⚠️ Error obteniendo películas.");
  }
};

handler.command = ["quever"];
handler.tags = ["fun"];

export default handler; 
