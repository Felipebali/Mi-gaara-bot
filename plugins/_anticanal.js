// 📂 plugins/anticanal.js — FelixCat_Bot 🐾
// Anti-Canal: elimina mensajes que contengan un enlace a canales de WhatsApp

// Regex oficial de enlaces a canales
const canalRegex = /whatsapp\.com\/channel\/[0-9A-Za-z]+/i;

// Dueños (si querés que estén exentos, agregalos acá)
const owners = ['59896026646', '59898719147'];

let handler = async (m, { conn, isAdmin, command }) => {
    if (!m.isGroup) return;

    // ---------------------------
    // ⚙️ ACTIVAR / DESACTIVAR
    // ---------------------------
    if (command === "anticanal") {

        if (!isAdmin)
            return m.reply("❌ Solo admins pueden activar o desactivar el Anti-Canal.");

        if (!global.db.data.chats[m.chat])
            global.db.data.chats[m.chat] = {};

        let chat = global.db.data.chats[m.chat];

        chat.anticanal = !chat.anticanal;

        return m.reply(`📢 Anti-Canal *${chat.anticanal ? "ACTIVADO" : "DESACTIVADO"}*`);
    }
};

export async function before(m, { conn }) {
    if (!m.isGroup) return;
    if (!m.text) return;

    let chat = global.db.data.chats[m.chat];
    if (!chat || !chat.anticanal) return;

    // Ignorar dueños (si querés que los bloquee igual, borra este bloque)
    const sender = m.sender.replace(/\D/g, "");
    if (owners.includes(sender)) return;

    // ---------------------------
    // 🚫 DETECTAR LINK DE CANAL
    // ---------------------------
    if (canalRegex.test(m.text)) {

        try {
            // ❌ Borrar mensaje
            await conn.sendMessage(m.chat, {
                delete: m.key
            });

            // ⚠️ Advertir
            await conn.sendMessage(m.chat, {
                text: `🚫 *Enlace a canal detectado y eliminado*\n@${sender} este tipo de enlace no está permitido.`,
                mentions: [m.sender]
            });
        } catch { }
    }
}

handler.command = ["anticanal"];
export default handler;
