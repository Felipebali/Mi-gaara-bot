let handler = {};

handler.before = async function (m, { conn }) {
    // Si no es evento de grupo → ignorar
    if (!m.messageStubType) return;

    // Tipos reales (actuales) de eventos
    const ADD = [27, 28];  // alguien se une / lo agregan
    const REMOVE = [32];   // alguien se va / lo expulsan

    // Si no es entrada ni salida → no hacer nada
    if (![...ADD, ...REMOVE].includes(m.messageStubType)) return;

    const groupId = m.chat;

    // Obtiene info del grupo
    const metadata = await conn.groupMetadata(groupId).catch(() => null);
    if (!metadata) return;

    const groupName = metadata.subject;
    const participants = m.messageStubParameters || [];

    for (let participant of participants) {
        const username = participant.split('@')[0];

        // 🎉 BIENVENIDA
        if (ADD.includes(m.messageStubType)) {
            await conn.sendMessage(groupId, {
                text: `🎉 ¡Bienvenido/a @${username} al grupo *${groupName}*! Disfruta tu estadía.`,
                mentions: [participant]
            });
        }

        // 👋 DESPEDIDA
        if (REMOVE.includes(m.messageStubType)) {
            await conn.sendMessage(groupId, {
                text: `😢 @${username} ha salido del grupo *${groupName}*.`,
                mentions: [participant]
            });
        }
    }
};

export default handler;
