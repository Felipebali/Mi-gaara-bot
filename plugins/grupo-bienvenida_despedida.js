// 📂 plugins/bienvenida.js

let handler = {};

handler.before = async function (m, { conn }) {
    if (!m.messageStubType) return; // Si no hay stub, no hay evento

    // Tipos de eventos de grupo
    const ADD = 29;    // alguien se une o lo agregan
    const REMOVE = 30; // alguien sale o lo sacan

    const groupId = m.chat;
    const groupMetadata = await conn.groupMetadata(groupId).catch(() => null);
    if (!groupMetadata) return;

    const groupName = groupMetadata.subject;
    const participants = m.messageStubParameters || [];

    for (let participant of participants) {
        const username = participant.split('@')[0];

        // 🔹 Bienvenida
        if (m.messageStubType === ADD) {
            const msg = `🎉 ¡Bienvenido/a @${username} al grupo *${groupName}*! Disfruta tu estadía.`;
            await conn.sendMessage(groupId, { 
                text: msg, 
                mentions: [participant] 
            });
        }

        // 🔹 Despedida
        if (m.messageStubType === REMOVE) {
            const msg = `😢 @${username} ha salido del grupo *${groupName}*.`;
            await conn.sendMessage(groupId, { 
                text: msg, 
                mentions: [participant] 
            });
        }
    }
};

export default handler;
