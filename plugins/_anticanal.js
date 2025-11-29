// 📂 plugins/anticanal.js — FelixCat_Bot 🐾
// Anti-Canal: elimina mensajes que tengan links de canales de WhatsApp
// On/Off con:  anticanal

const canalRegex = /(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/[a-zA-Z0-9]+/i;
const owners = ['59896026646', '59898719147', '59892363485']; // DUEÑOS

let handler = async (m, { conn, isAdmin, isBotAdmin, command }) => {

    // ≡ ACTIVAR / DESACTIVAR
    if (command === "anticanal") {

        if (!m.isGroup) return m.reply("❗ Solo funciona en grupos.");
        if (!isAdmin) return m.reply("❌ Solo admins pueden activar/desactivar el Anti-Canal.");

        if (!global.db.data.chats[m.chat])
            global.db.data.chats[m.chat] = {};

        let chat = global.db.data.chats[m.chat];

        chat.anticanal = !chat.anticanal;

        return m.reply(`📡 Anti-Canal *${chat.anticanal ? "ACTIVADO" : "DESACTIVADO"}*`);
    }

};

export default handler;


// =======================
// 🔥 FILTRO AUTOMÁTICO
// =======================
export async function before(m, { conn, isAdmin, isBotAdmin }) {
    if (!m.isGroup) return;

    const chat = global.db.data.chats[m.chat] || {};
    if (!chat.anticanal) return; // No activado → no hace nada

    if (!m.text) return;
    if (!canalRegex.test(m.text)) return; // No es canal → ignorar

    const sender = m.sender.replace(/\D/g, '');

    // Dueños EXENTOS (no se elimina)
    if (owners.includes(sender)) return;

    // Admins del grupo EXENTOS
    if (isAdmin) return;

    // No bot admin → no puede borrar
    if (!isBotAdmin) {
        return m.reply("⚠️ Tengo Anti-Canal activado, pero necesito ser *admin* para borrar mensajes.");
    }

    try {
        await conn.sendMessage(m.chat, { delete: m.key });
        await conn.sendMessage(m.chat, { text: `🚫 Se prohiben los links de canal en este grupo.` });
    } catch {}
}
