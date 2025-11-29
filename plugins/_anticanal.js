// 📂 plugins/anticanal.js — Anti-canal WhatsApp ✔
// Funcional en TODOS los loaders modernos

const owners = ['59896026646', '59898719147', '59892363485'];
const canalRegex = /(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/[A-Za-z0-9_-]+/i;

// ---------------------------
// 🔘 ACTIVAR / DESACTIVAR
// ---------------------------
let handler = async (m, { conn, isAdmin, command }) => {
    if (command === "anticanal") {
        if (!isAdmin) return m.reply("❌ Solo *admins* pueden activar o desactivar Anti-Canal.");

        if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};
        let chat = global.db.data.chats[m.chat];

        chat.anticanal = !chat.anticanal;

        return m.reply(`📢 Anti-Canal *${chat.anticanal ? "ACTIVADO" : "DESACTIVADO"}*`);
    }
};

export async function before(m, { conn, isAdmin, isBotAdmin }) {
    if (!m.isGroup) return true;

    // Asegurar base
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};
    let chat = global.db.data.chats[m.chat];

    if (!chat.anticanal) return true;

    // OBTENER TEXTO DEL MENSAJE
    const text =
        m.text ||
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        m.message?.videoMessage?.caption ||
        "";

    if (!text) return true;

    // ¿No contiene link de canal?
    if (!canalRegex.test(text)) return true;

    const senderNum = m.sender.replace(/\D/g, '');

    // Owner exento
    if (owners.includes(senderNum)) return true;

    // Bot no es admin → no puede borrar
    if (!isBotAdmin) return m.reply("⚠️ Hay un link de canal, pero no soy admin.");

    // -------------------------------
    // 🔥 BORRAR MENSAJE (versión BAILEYS nueva)
    // -------------------------------
    try {
        await conn.sendMessage(m.chat, {
            delete: {
                remoteJid: m.chat,
                fromMe: false,
                id: m.key.id,
                participant: m.key.participant || m.sender,
            }
        });
    } catch (e) {
        console.error("Error al borrar:", e);
    }

    // AVISO
    try {
        await conn.sendMessage(m.chat, {
            text: `🚫 *Enlace de canal eliminado*\n@${senderNum}`,
            mentions: [m.sender]
        });
    } catch {}

    // EXPULSAR SI NO ES ADMIN
    if (!isAdmin) {
        try {
            await conn.groupParticipantsUpdate(m.chat, [m.sender], "remove");
        } catch {}
    }

    return false;
}

handler.command = /^anticanal$/i;
export default handler;
