// 📂 plugins/anticanal.js — FelixCat_Bot 🐾
// Anti-Canal: Borra cualquier enlace de canales de WhatsApp en grupos

const channelRegex = /whatsapp\.com\/channel\/([0-9A-Za-z]+)/i;

// DUEÑOS (números limpios, sin @s.whatsapp.net)
const owners = ["59896026646", "59898719147", "59892363485"];

let handler = async function (m, { conn, isAdmin, isBotAdmin }) {
    if (!m.isGroup) return;

    const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {});
    if (!chat.anticanal) return;

    const sender = m.sender.replace(/\D+/g, "");

    // ❗ Si querés que los owners NO sean castigados, descomenta esto:
    // if (owners.includes(sender)) return;

    // Detecta link de canal
    const texto = m.text || "";
    if (!channelRegex.test(texto)) return;

    // Debe ser admin el bot para borrar
    if (!isBotAdmin) {
        return m.reply("⚠️ *Anti-Canal activo*, pero no puedo borrar mensajes porque no soy admin.");
    }

    // 🗑️ Borra el mensaje
    try {
        await conn.sendMessage(m.chat, { delete: m.key });
    } catch (e) {}

    // ⚠️ Advertencia al usuario
    await conn.reply(
        m.chat,
        `🚫 *No se permiten enlaces de canales de WhatsApp.*\n@${sender} tu mensaje fue eliminado.`,
        m,
        { mentions: [m.sender] }
    );
};

export default handler;

/* -----------------------------------------
   🔧 Comando: .anticanal
   Activa o desactiva el sistema
------------------------------------------ */

handler.command = /^anticanal$/i;

handler.admin = true;     // Solo admins pueden activarlo
handler.group = true;

handler.run = async (m, { conn }) => {
    const chat = global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {});
    chat.anticanal = !chat.anticanal;

    m.reply(
        `📢 *Anti-Canal ${chat.anticanal ? "ACTIVADO" : "DESACTIVADO"}*\n` +
        `Los enlaces a *canales de WhatsApp* ahora ${chat.anticanal ? "serán bloqueados." : "son permitidos."}`
    );
};
