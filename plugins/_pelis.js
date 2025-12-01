import fetch from "node-fetch";
import axios from "axios";

const handler = async (m, { text, conn }) => {
  try {
    if (!text) return m.reply("🎬 ¿Qué película querés buscar?\nEjemplo:\n.cuevana terminator");

    m.reply("🔎 Buscando películas...");

    const res = await axios.get(`https://api.consumet.org/movies/flixhq/${encodeURIComponent(text)}`);
    const data = res.data.results;

    if (!data || data.length === 0)
      return m.reply("❌ No se encontraron resultados.");

    // película random
    const p = data[Math.floor(Math.random() * data.length)];

    let caption = `🎬 *${p.title}*\n`;
    caption += `📅 Año: ${p.releaseDate || "?"}\n`;
    caption += `⭐ Rating: ${p.rating || "?"}\n`;
    caption += `🔗 Link: ${p.url}\n\n`;
    caption += "🍿 Resultados similares:\n\n";

    data.slice(0, 10).forEach((x, i) => {
      caption += `*${i + 1}.* ${x.title} (${x.releaseDate || "?"})\n`;
    });

    const img = p.image || "https://i.imgur.com/2M7R5wF.jpeg";

    conn.sendFile(m.chat, img, "pelicula.jpg", caption, m);

  } catch (e) {
    console.error(e);
    return m.reply("❌ Error al obtener películas.");
  }
};

handler.command = ["cuevana", "pelis", "pelisplus"];
export default handler;
