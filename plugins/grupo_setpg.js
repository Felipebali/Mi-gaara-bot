// 📂 plugins/grupos-setpg.js
// Cambiar la foto del GRUPO citando una imagen — Solo Owners

import { downloadContentFromMessage } from "@whiskeysockets/baileys";

// 📌 Owners permitidos (solo números)
const OWNERS = [
  "59896026646",
  "59898719147"
];

let handler = async (m, { conn }) => {
  try {
    if (!m.isGroup) {
      return m.reply("❌ Este comando solo funciona en grupos.");
    }

    // Normalizar número del autor
    const sender = m.sender.replace(/[^0-9]/g, "");

    // 🔐 Solo owners
    if (!OWNERS.includes(sender)) {
      return m.reply("❌ Solo los *owners* pueden cambiar la foto del grupo.");
    }

    // Debe citar una imagen
    const q = m.quoted;
    if (!q) {
      return m.reply("📸 *Debes responder a una imagen* con:\n\n.setpg");
    }

    const mime = q.mimetype || (q.msg && q.msg.mimetype) || "";
    if (!mime.startsWith("image/")) {
      return m.reply("📸 *Debes citar una imagen válida*.");
    }

    // Descargar imagen citada
    const stream = await downloadContentFromMessage(q.msg || q, "image");
    let buffer = Buffer.from([]);

    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    // Cambiar foto del grupo
    await conn.query({
      tag: "iq",
      attrs: {
        type: "set",
        xmlns: "w:profile:picture",
        to: m.chat
      },
      content: [{
        tag: "picture",
        attrs: { type: "image" },
        content: buffer
      }]
    });

    await m.reply("✅ *Foto del grupo actualizada correctamente.*");

  } catch (e) {
    console.error(e);
    m.reply("❌ Error al intentar cambiar la foto del grupo.");
  }
};

// Datos del comando
handler.help = ["setpg"];
handler.tags = ["owner"];
handler.command = /^setpg$/i;
handler.owner = true;

export default handler;
