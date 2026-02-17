// 📂 plugins/welcome.js
// Welcome + Leave con foto de perfil — SIN ERRORES

let handler = async (m, { conn, isAdmin }) => {
    if (!m.isGroup)
        return conn.sendMessage(m.chat, { text: "❌ Solo funciona en grupos." });

    if (!isAdmin)
        return conn.sendMessage(m.chat, { text: "⚠️ Solo los administradores pueden usar este comando." });

    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};

    let chat = global.db.data.chats[m.chat];

    if (typeof chat.welcome === 'undefined') chat.welcome = false;

    chat.welcome = !chat.welcome;

    await conn.sendMessage(m.chat, {
        text: `✨ *Welcome ${chat.welcome ? "ACTIVADO" : "DESACTIVADO"}*\nLos mensajes de entrada y salida están ${chat.welcome ? "habilitados" : "deshabilitados"}.`
    });
};


// 📌 EVENTO DE ENTRADA Y SALIDA
handler.participantsUpdate = async function ({ id, participants, action }) {

    if (!global.db.data.chats[id]) global.db.data.chats[id] = {};
    let chat = global.db.data.chats[id];

    if (!chat.welcome) return;

    const conn = this;

    let metadata = await conn.groupMetadata(id);
    let groupName = metadata.subject;

    for (let user of participants) {

        let pp;
        try {
            pp = await conn.profilePictureUrl(user, 'image');
        } catch {
            pp = 'https://i.imgur.com/6RLK9Hh.png';
        }

        // 🎉 Usuario entra
        if (action === 'add') {
            await conn.sendMessage(id, {
                image: { url: pp },
                caption: `🎉 ¡Bienvenido/a *@${user.split("@")[0]}* al grupo *${groupName}*!\nDisfruta tu estadía.`,
                mentions: [user]
            });
        }

        // 👋 Usuario sale
        if (action === 'remove') {
            await conn.sendMessage(id, {
                image: { url: pp },
                caption: `👋 *@${user.split("@")[0]}* salió del grupo *${groupName}*.`,
                mentions: [user]
            });
        }
    }
};


handler.command = ["welcome", "welc", "wl"];
handler.group = true;
handler.admin = true;

export default handler;
