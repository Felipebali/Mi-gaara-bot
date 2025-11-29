/* plugins/_deletebotmsg.js
   SILENT DELETE — SOLO OWNERS
   - H : elimina el mensaje citado (de cualquiera)
*/

let handler = async (m, { conn }) => {
    const owners = ['59898719147','59896026646','59892363485']; // NUMEROS DE OWNERS
    const sender = m.sender.split('@')[0];

    // Solo owners
    if (!owners.includes(sender)) return;

    // Debe citar un mensaje
    if (!m.quoted) return;

    try {
        const quoted = m.quoted;

        // 🗑️ Borrar el mensaje citado (sea de quien sea)
        await conn.sendMessage(m.chat, { delete: quoted.key });

        // 🗑️ Borrar el mensaje del owner ("H")
        await conn.sendMessage(m.chat, { delete: m.key });

    } catch (e) {
        // silencioso
    }
};

// Detecta SOLO la letra H sin prefijo
handler.customPrefix = /^h$/i;
handler.command = new RegExp(); // comando invisible

export default handler;
