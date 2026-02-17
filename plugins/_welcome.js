// 📂 plugins/welcome.js
// Welcome + Leave usando sistema de foto igual a perfil.js

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

    // =====================
    // BIENVENIDA
    // =====================
    for (let user of added) {

        const texto = `🎉 ¡Bienvenido/a *@${user.split("@")[0]}* al grupo *${groupName}*!\nDisfruta tu estadía.`

        let ppUrl = null
        try {
            ppUrl = await conn.profilePictureUrl(user, 'image')
        } catch {
            ppUrl = null
        }

        // Si tiene foto → imagen
        if (ppUrl) {
            await conn.sendMessage(m.chat, {
                image: { url: ppUrl },
                caption: texto,
                mentions: [user]
            })
        }

        // Si NO tiene foto → texto
        else {
            await conn.sendMessage(m.chat, {
                text: texto,
                mentions: [user]
            })
        }
    }


    // =====================
    // DESPEDIDA
    // =====================
    for (let user of removed) {

        const texto = `👋 *@${user.split("@")[0]}* salió del grupo *${groupName}*.`

        let ppUrl = null
        try {
            ppUrl = await conn.profilePictureUrl(user, 'image')
        } catch {
            ppUrl = null
        }

        if (ppUrl) {
            await conn.sendMessage(m.chat, {
                image: { url: ppUrl },
                caption: texto,
                mentions: [user]
            })
        } else {
            await conn.sendMessage(m.chat, {
                text: texto,
                mentions: [user]
            })
        }
    }

    chat.participants = current;
};


handler.command = ["welcome", "welc", "wl"];
handler.group = true;
handler.admin = true;

export default handler;
