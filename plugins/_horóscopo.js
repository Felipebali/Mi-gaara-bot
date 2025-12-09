import axios from "axios"

let handler = async (m, { conn, text }) => {

  const caption = `🌠 *INGRESE SU SIGNO* 🌠

♈ .horoscopo aries
♉ .horoscopo tauro
♊ .horoscopo geminis
♋ .horoscopo cancer
♌ .horoscopo leo
♍ .horoscopo virgo
♎ .horoscopo libra
♏ .horoscopo escorpio
♐ .horoscopo sagitario
♑ .horoscopo capricornio
♒ .horoscopo acuario
♓ .horoscopo piscis`;

  if (!text) 
    return conn.sendMessage(m.chat, { text: caption }, { quoted: m });

  const signos = [
    "aries", "tauro", "geminis", "cancer", "leo", "virgo",
    "libra", "escorpio", "sagitario", "capricornio", "acuario", "piscis"
  ];

  if (!signos.includes(text.toLowerCase()))
    return conn.sendMessage(m.chat, { text: "❌ Signo inválido." }, { quoted: m });

  let sign = text.trim().toLowerCase();
  if (sign === "escorpio") sign = "escorpion";

  try {
    let response = await axios.get(`https://www.horoscopo.com/horoscopos/general-diaria-${sign}`);
    let html = response.data;

    let startIndex = html.indexOf("<p>") + 3;
    let endIndex = html.indexOf("</p>", startIndex);
    let horoscope = html.substring(startIndex, endIndex);

    let [tes1, tes2] = horoscope.split("-");

    // =============== EMOJIS SEGÚN SIGNO ===============
    const emojis = {
      aries: "♈", tauro: "♉", geminis: "♊", cancer: "♋",
      leo: "♌", virgo: "♍", libra: "♎", escorpio: "♏",
      sagitario: "♐", capricornio: "♑", acuario: "♒", piscis: "♓"
    };

    let emoji = emojis[text.toLowerCase()];
    await conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } });

    let teks = `*${emoji} ${text.toUpperCase()} ${emoji}*\n\n` +
               `*📅 FECHA:* ${tes1}\n\n${tes2}`;

    let img = "https://telegra.ph/file/cd132232c09831825aed2.jpg";

    let msg = await conn.sendMessage(
      m.chat,
      { image: { url: img }, caption: teks },
      { quoted: m }
    );

    await conn.sendMessage(m.chat, { react: { text: "🌠", key: msg.key } });

  } catch (e) {
    console.error(e);
    return conn.sendMessage(
      m.chat,
      { text: `❌ Error al obtener el horóscopo de *${text}*.` },
      { quoted: m }
    );
  }
};

handler.command = /^(horoscopo|horóscopo)$/i;
handler.botAdmin = false; // ❌ No necesita ser admin

export default handler; 
