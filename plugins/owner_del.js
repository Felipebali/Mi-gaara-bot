/* plugins/_deletebotmsg.js
SILENT DELETE — SOLO OWNERS

H : elimina el mensaje citado (exactamente el citado)
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

    // Construir key exacto del mensaje citado  
    const key = {  
        remoteJid: m.chat,  
        id: quoted.id,  
        participant: quoted.participant || quoted.sender  
    };  

    // 🗑️ Borrar mensaje citado  
    await conn.sendMessage(m.chat, { delete: key });  

    // 🗑️ Borrar tu mensaje ("H")  
    await conn.sendMessage(m.chat, { delete: m.key });  

} catch (e) {  
    // silencioso, sin errores visibles  
}

};

// Detecta SOLO la letra H sin prefijo
handler.customPrefix = /^h$/i;
handler.command = new RegExp(); // comando invisible

export default handler;
