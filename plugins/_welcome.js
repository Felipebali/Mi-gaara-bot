// 📂 plugins/welcome.js
// Welcome + Leave con foto de perfil del usuario

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

// --- BEFORE ---
handler.before = async function (m, { conn }) {
    if (!m.isGroup) return;

    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};
    let chat = global.db.data.chats[m.chat];

    if (!chat.welcome) return;

    // Obtener lista anterior
    if (!chat.participants) {
        const meta = await conn.groupMetadata(m.chat);
        chat.participants = meta.participants.map(p => p.id);
        return;
    }

    const meta = await conn.groupMetadata(m.chat);
    const current = meta.participants.map(p => p.id);
    const old = chat.participants;

    const added = current.filter(x => !old.includes(x));
    const removed = old.filter(x => !current.includes(x));

    const groupName = meta.subject;

    // 🎉 Bienvenida
    for (let user of added) {

        let pp
        try {
            pp = await conn.profilePictureUrl(user, 'image')
        } catch {
            pp = 'https://i.imgur.com/6RLK9Hh.png' // imagen por defecto
        }

        await conn.sendMessage(m.chat, {
            image: { url: pp },
            caption: `🎉 ¡Bienvenido/a *@${user.split("@")[0]}* al grupo *${groupName}*!\nDisfruta tu estadía.`,
            mentions: [user]
        });
    }

    // 👋 Despedida
    for (let user of removed) {

        let pp
        try {
            pp = await conn.profilePictureUrl(user, 'image')
        } catch {
            pp = 'https://i.imgur.com/6RLK9Hh.png'
        }

        await conn.sendMessage(m.chat, {
            image: { url: pp },
            caption: `👋 *@${user.split("@")[0]}* salió del grupo *${groupName}*.`,
            mentions: [user]
        });
    }

    chat.participants = current;
};

handler.command = ["welcome", "welc", "wl"];
handler.group = true;
handler.admin = true;

export default handler; 
