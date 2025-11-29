// 📂 plugins/anticanal.js — Anti-Canal WhatsApp ✔
// Bloquea links de canales como: https://whatsapp.com/channel/XXXX

const owners = ['59896026646', '59898719147', '59892363485']; // dueños EXENTOS
const canalRegex = /https?:\/\/(www\.)?whatsapp\.com\/channel\/[0-9A-Za-z]+/i;

let handler = async (m, { conn, isAdmin, isBotAdmin, command }) => {

    // -----------------------
    // 🔘 ACTIVAR / DESACTIVAR
    // -----------------------
    if (command === "anticanal") {
        if (!isAdmin) return m.reply("❌ Solo *admins* pueden activar o desactivar Anti-Canal.");

        if (!global.db.data.chats[m.chat])
            global.db.data.chats[m.chat] = {};

        let chat = global.db.data.chats[m.chat];
        chat.anticanal = !chat.anticanal;

        return m.reply(`📢 Anti-Canal *${chat.anticanal ? "ACTIVADO" : "DESACTIVADO"}*`);
    }

};

export async function before(m, { conn, isAdmin, isBotAdmin }) {
    if (!m.isGroup) return true;
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};

    const chat = global.db.data.chats[m.chat];

    // ❌ Si está desactivado → no hacer nada
    if (!chat.anticanal) return true;

    const text = m.text || "";

    // ❌ Si no contiene link de canal → ignorar
    if (!canalRegex.test(text)) return true;

    const sender = m.sender.replace(/[^0-9]/g, '');
    const itsOwner = owners.includes(sender);

    // ✔ Exento si es owner
    if (itsOwner) return true;

    // ❌ Si el bot no es admin → solo avisa
    if (!isBotAdmin) {
        return m.reply("⚠️ Hay un link de *canal*, pero no soy admin para borrarlo.");
    }

    // 🗑️ BORRAR MENSAJE
    try {
        await conn.sendMessage(m.chat, { delete: m.key });
    } catch {}

    // 🚫 Expulsar si NO es admin
    if (!isAdmin) {
        try {
            await conn.groupParticipantsUpdate(m.chat, [m.sender], "remove");
        } catch {}
    }

    return false;
}

handler.command = ["anticanal"];
export default handler;
