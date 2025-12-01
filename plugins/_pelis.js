// 📂 plugins/google-pelis.js
import fetch from "node-fetch";
import cheerio from "cheerio";

let handler = async (m, { text }) => {
  if (!text) {
    return m.reply(
      `🎬 Ingresa qué querés buscar en Google.\n\nEjemplo:\n.pelis accion`
    );
  }

  await m.reply("🔎 Buscando películas en Google...");

  try {
    const query = encodeURIComponent(`películas ${text}`);
    const url = `https://www.google.com/search?q=${query}&hl=es`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36",
      },
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    const resultados = [];

    $("div.BNeawe.vvjwJb.AP7Wnd").each((i, el) => {
      const titulo = $(el).text();
      if (titulo && !resultados.includes(titulo)) {
        resultados.push(titulo);
      }
    });

    if (resultados.length === 0) {
      return m.reply("❌ No encontré resultados. Intenta otra búsqueda.");
    }

    const lista = resultados.slice(0, 10).map((t, i) => `🎬 *${i + 1}.* ${t}`).join("\n");

    m.reply(
      `🍿 *Resultados de Google para:* _${text}_\n\n${lista}`
    );

  } catch (e) {
    console.log(e)
    m.reply("⚠️ Error al scrapear Google. Puede que haya bloqueo temporal.");
  }
};

handler.command = ["pelis", "googlepelis", "buscapelis"];
export default handler;
