// 📂 plugins/grupos-setpg.js
// Cambiar la foto del GRUPO citando una imagen — Solo Owners

import { downloadContentFromMessage } from "@whiskeysockets/baileys";

const owners = ["59896026646", "59898719147"]; // SOLO NÚMEROS LIMPIOS

let handler = async (m, { conn }) => {
  try {
    if (!m.isGroup) {
      return m.reply("❌ Este comando solo funciona en grupos.");
    }

    // Normaliza número
    const sender = m.sender.replace(/[^0-9]/g, "");

    // 🔐 SOLO OWNERS
    if (!owners.includes(sender)) {
      return m.reply("❌ Solo los *owners* pueden cambiar la foto del grupo.");
    }

    // 📸 DEBE ser una imagen CITADA
    if (!m.quoted) {
      return m.reply("📸 *Debes responder a una imagen* con:\n\n.setpg");
    }

    const q = m.quoted;
    const mime = (q.msg || q).mimetype || "";

    if (!mime.startsWith("image/")) {
      return m.reply("📸 *Debes citar una imagen válida*.");
    }

    // 📥 Descargar imagen citada
    const stream = await downloadContentFromMessage(q.msg || q, "image");
    let buffer = Buffer.from([]);

    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    // 🖼️ Establecer foto del GRUPO (método actual funcional)
    await conn.updateProfilePicture(m.chat, buffer);

    await m.reply("✅ *Foto del grupo actualizada correctamente!*");

  } catch (e) {
    console.error("Error en grupos-setpg:", e);
    m.reply("⚠️ Error al intentar cambiar la foto del grupo.");
  }
};

// Datos del comando
handler.help = ["setpg"];
handler.tags = ["owner"];

// array de comandos
handler.command = ["setpg", "cambiarpg", "grouppic"];

handler.owner = true;

export default handler;
