import fetch from "node-fetch";
import cheerio from "cheerio";

let handler = async (m, { text }) => {
  if (!text)
    return m.reply(
`🎬 ¿Qué películas querés buscar?

Ejemplo:
.pelis accion
.pelis terror 2024`
    );

  m.reply("🔎 Buscando películas en Google...");

  try {
    const query = encodeURIComponent(`películas ${text}`);
    const url = `https://www.google.com/search?q=${query}&hl=es`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; x64; rv:109.0) Gecko/20100101 Firefox/117.0",
        Accept: "text/html",
      },
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    let resultados = [];

    // MÉTODO 1: bloque tipo carrusel de películas
    $("div[role='listitem'] div.BNeawe").each((i, el) => {
      const t = $(el).text().trim();
      if (t && t.length > 2) resultados.push(t);
    });

    // MÉTODO 2: títulos grandes del buscador
    if (resultados.length < 3) {
      $("div.BNeawe.vvjwJb.AP7Wnd").each((i, el) => {
        const t = $(el).text().trim();
        if (t) resultados.push(t);
      });
    }

    // MÉTODO 3: fallback extra (Google usa este DOM a veces)
    if (resultados.length < 3) {
      $("span.BNeawe.s3v9rd.AP7Wnd").each((i, el) => {
        const t = $(el).text().trim();
        if (t && t.split(" ").length <= 6) resultados.push(t);
      });
    }

    // Limpieza
    resultados = [...new Set(resultados)]
      .filter(t => /^[A-Za-zÁÉÍÓÚÑáéíóú0-9\s:()'-]{3,}/.test(t))
      .slice(0, 10);

    if (resultados.length === 0)
      return m.reply("❌ Google no devolvió resultados esta vez. Probá otra palabra o más específica.");

    let texto = `🍿 *Resultados para:* _${text}_\n\n`;
    resultados.forEach((t, i) => (texto += `🎬 *${i + 1}.* ${t}\n`));

    return m.reply(texto);

  } catch (e) {
    console.log(e);
    return m.reply("⚠️ Error: Google bloqueó temporalmente el scraping.");
  }
};

handler.command = ["pelis", "googlepelis", "buscapelis"];
export default handler;
