let handler = {};

handler.before = async function (m, { conn }) {
    // Solo grupos
    if (!m.isGroup) return;

    // Asegurar espacio en la DB
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};
    let chat = global.db.data.chats[m.chat];

    // Guardar lista de participantes si no existe
    if (!chat.participants) {
        const meta = await conn.groupMetadata(m.chat);
        chat.participants = meta.participants.map(p => p.id);
        return;
    }

    // Obtener lista actual
    const meta = await conn.groupMetadata(m.chat);
    const current = meta.participants.map(p => p.id);
    const old = chat.participants;

    // Detectar usuarios nuevos
    const added = current.filter(x => !old.includes(x));
    // Detectar usuarios que se fueron
    const removed = old.filter(x => !current.includes(x));

    const groupName = meta.subject;

    // BIENVENIDA
    for (let user of added) {
        const username = user.split("@")[0];
        await conn.sendMessage(m.chat, {
            text: `🎉 ¡Bienvenido/a @${username} al grupo *${groupName}*! Disfruta tu estadía.`,
            mentions: [user]
        });
    }

    // DESPEDIDA
    for (let user of removed) {
        const username = user.split("@")[0];
        await conn.sendMessage(m.chat, {
            text: `😢 @${username} ha salido del grupo *${groupName}*.`,
            mentions: [user]
        });
    }

    // Actualizar DB con la nueva lista
    chat.participants = current;
};

export default handler;
