// 📂 plugins/welcome.js
// Bienvenida + despedida con toggle usando solo:  welcome

let handler = {};

handler.before = async function (m, { conn }) {
    // Solo grupos
    if (!m.isGroup) return;

    // Base de datos
    if (!global.db.data.chats[m.chat])
        global.db.data.chats[m.chat] = {};

    let chat = global.db.data.chats[m.chat];

    // ❌ Si welcome está desactivado → no hacer nada
    if (!chat.welcome) return;

    // Si no existe lista anterior → guardarla
    if (!chat.participants) {
        const meta = await conn.groupMetadata(m.chat);
        chat.participants = meta.participants.map(p => p.id);
        return;
    }

    // Obtener metadata actual
    const meta = await conn.groupMetadata(m.chat);
    const current = meta.participants.map(p => p.id);
    const old = chat.participants;

    // Detectar entradas y salidas
    const added = current.filter(x => !old.includes(x));
    const removed = old.filter(x => !current.includes(x));

    const groupName = meta.subject;

    // 🎉 BIENVENIDA
    for (let user of added) {
        const username = user.split("@")[0];
        await conn.sendMessage(m.chat, {
            text: `🎉 ¡Bienvenido/a @${username} al grupo *${groupName}*! Disfruta tu estadía.`,
            mentions: [user]
        });
    }

    // 👋 DESPEDIDA
    for (let user of removed) {
        const username = user.split("@")[0];
        await conn.sendMessage(m.chat, {
            text: `😢 @${username} ha salido del grupo *${groupName}*.`,
            mentions: [user]
        });
    }

    // Guardar nueva lista
    chat.participants = current;
};

// 🔧 Comando: welcome (toggle)
handler.command = /^welcome$/i;
handler.admin = true;
handler.group = true;

handler.run = async (m, { conn }) => {
    const chat = global.db.data.chats[m.chat] || {};

    // Alternar estado
    chat.welcome = !chat.welcome;

    await m.reply(`✨ *Welcome ${chat.welcome ? "ACTIVADO" : "DESACTIVADO"}*\nMensajes de bienvenida y despedida ahora están ${chat.welcome ? "encendidos" : "apagados"}.`);
};

export default handler;
