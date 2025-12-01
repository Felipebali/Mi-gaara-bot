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

    let resultados = [];

    // MÉTODO 1: Titles dentro de los carruseles modernos
    $("div[role='heading']").each((i, el) => {
      const t = $(el).text().trim();
      if (t && t.length > 2 && !t.match(/Google|Buscar/)) resultados.push(t);
    });

    // MÉTODO 2: Titles de tarjetas informativas
    $("div[jsname='U8S5sf']").each((i, el) => {
      const t = $(el).text().trim();
      if (t && t.length > 2) resultados.push(t);
    });

    // MÉTODO 3: Card-style results (muy estable)
    $("div[data-attrid='title']").each((i, el) => {
      const t = $(el).text().trim();
      if (t) resultados.push(t);
    });

    // MÉTODO 4: Titles dentro de snippets recientes
    $("h3").each((i, el) => {
      const t = $(el).text().trim();
      if (t && t.length > 2) resultados.push(t);
    });

    // Limpieza
    resultados = [...new Set(resultados)]
      .filter(t => /^[A-Za-zÁÉÍÓÚÑ0-9\s:()'-]{3,}/.test(t))
      .slice(0, 10);

    if (resultados.length === 0)
      return m.reply("❌ No encontré resultados. Google cambió el formato o no hay coincidencias.");

    let texto = `🍿 *Resultados para:* _${text}_\n\n`;
    resultados.forEach((t, i) => {
      texto += `🎬 *${i + 1}.* ${t}\n`;
    });

    return m.reply(texto);

  } catch (e) {
    console.log(e);
    return m.reply("⚠️ Google bloqueó temporalmente el scraping. Intentá de nuevo.");
  }
};

handler.command = ["pelis", "googlepelis", "buscapelis"];
export default handler;
