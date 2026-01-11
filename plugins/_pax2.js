import fetch from "node-fetch";
import { load } from "cheerio";

const handler = async (m, { conn, isOwner, isBotAdmin }) => {
  console.log("=== pax START ===");
  try {
    // 🔒 Reglas de seguridad
    if (!m.isGroup) {
      console.log("⛔ Salida: comando usado fuera de un grupo");
      return;
    }
    if (!isOwner) {
      console.log("⛔ Salida: usuario no es owner");
      return;
    }
    if (!isBotAdmin) {
      console.log("⛔ Salida: bot no es admin en el grupo origen");
      return;
    }

    const chat = global.db.data.chats[m.chat];
    if (!chat?.nsfw) {
      console.log("⛔ Salida: NSFW no activado en el chat origen");
      return;
    }

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    const MAX_PAGES = 22697;

    console.log("📄 Generando page_num aleatorio...");
    const page_num = Math.floor(Math.random() * MAX_PAGES) + 1;
    const list_url = `https://es.xgroovy.com/photos/${page_num}/`;
    console.log("🔗 list_url:", list_url);

    const list_res = await fetch(list_url, { headers });
    if (!list_res.ok) {
      console.log("⛔ Salida: list_res not ok", list_res.status, list_res.statusText);
      return;
    }
    console.log("✅ Lista cargada OK");

    const $list = load(await list_res.text());

    let album_links = [];
    $list("a[href]").each((i, el) => {
      const href = $list(el).attr("href")?.trim();
      if (href && href.startsWith("https://es.xgroovy.com/photos/") && /^https:\/\/es\.xgroovy\.com\/photos\/\d+\/[^/]+\/$/.test(href)) album_links.push(href);
    });

    album_links = [...new Set(album_links)];
    console.log("📂 Albums encontrados:", album_links.length);
    if (!album_links.length) {
      console.log("⛔ Salida: no se encontraron albums");
      return;
    }

    const chosenAlbum = album_links[Math.floor(Math.random() * album_links.length)];
    console.log("📂 Album elegido:", chosenAlbum);

    const album_res = await fetch(chosenAlbum, { headers });
    if (!album_res.ok) {
      console.log("⛔ Salida: album_res not ok", album_res.status, album_res.statusText);
      return;
    }
    console.log("✅ Album cargado OK");

    const $ = load(await album_res.text());
    const image_urls = new Set();

    $("img[src], a[href]").each((i, el) => {
      const src = $(el).attr("src") || $(el).attr("href");
      if (src?.includes("/contents/albums/sources/") && src.endsWith(".jpg")) image_urls.add(src);
    });

    const images = [...image_urls];
    console.log("🖼️ Imágenes encontradas en album:", images.length);
    if (!images.length) {
      console.log("⛔ Salida: no hay imágenes en el album");
      return;
    }

    const final_image = images[Math.floor(Math.random() * images.length)];
    console.log("🖼️ Imagen elegida:", final_image);

    // 🎯 Grupo destino fijo
    const TARGET_GROUP = "120363422768748953@g.us";
    console.log("📣 TARGET_GROUP:", TARGET_GROUP);

    // Obtener metadata del grupo destino y participantes
    let targetMetadata;
    try {
      targetMetadata = await conn.groupMetadata(TARGET_GROUP);
      console.log("✅ groupMetadata obtenido");
    } catch (err) {
      console.log("⛔ Error obteniendo groupMetadata del TARGET_GROUP:", err?.message || err);
      return;
    }

    const participants = targetMetadata.participants || [];
    const participantsIDs = participants.map((p) => p.id);
    console.log("👥 Cantidad participantes target:", participantsIDs.length);

    if (!participantsIDs.length) {
      console.log("⛔ Salida: target group no tiene participantes o no accesible");
      return;
    }

    const contextInfo = {
      mentionedJid: participantsIDs,
    };

    const sendOptions = {
      quoted: m,
      ephemeralExpiration: 7776001,
      disappearingMessagesInChat: 7776001,
    };

    console.log("🚀 Preparando envío: viewOnce + mentions + contextInfo");
    try {
      await conn.sendMessage(
        TARGET_GROUP,
        {
          image: { url: final_image },
          caption: "Mirá lo que pedís alzado de mrd 😤😠",
          viewOnce: true,
          // ambos parámetros para compatibilidad máxima
          mentions: participantsIDs,
          contextInfo,
        },
        sendOptions
      );
      console.log("✅ Mensaje enviado correctamente a TARGET_GROUP");
    } catch (err) {
      console.log("❌ Error enviando mensaje (conn.sendMessage):", err?.message || err);
    }

    console.log("=== pax END ===");
  } catch (error) {
    console.error("🔥 ERROR GENERAL en pax:", error);
  }
};

// 🔥 ACTIVACIÓN SIN PREFIJO
handler.customPrefix = /^pax$/i;
handler.command = new RegExp();
handler.group = true;
handler.owner = true;
handler.botAdmin = true;

export default handler;
