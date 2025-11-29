// plugins/grupo-configuracion.js — Panel actualizado y optimizado

// 🔥 Mapa de alias para compatibilidad con cualquier plugin
const aliasMap = {
    welcome: ["welcome"],
    despedida: ["despedida"],
    antifake: ["antifake", "antiFake"],
    antispam: ["antispam", "antiSpam"],
    antitoxic: ["antitoxic", "antiToxic"],
    detect: ["detect"],
    autosticker: ["autosticker", "autoSticker"],
    nsfw: ["nsfw"],
    juegos: ["juegos", "games"],
    public: ["public", "modoPublico"],
    onlyadmin: ["onlyadmin", "onlyAdmin", "soloAdmins", "soloAdmin", "modoadmin"],
    antillamada: ["antillamada", "antiLlamada"],
    antibot: ["antibot"],
    antilink: ["antilink", "antiLink"],
    antilink2: ["antilink2", "antiLink2", "antilinks2"],
    anticanal: ["anticanal", "antiCanal", "antichannel", "antiChannel"]
};

// 🟣 Función segura para obtener valores
function getChatValue(chat, key) {
    const keys = aliasMap[key];
    if (!keys) return false;

    for (const k of keys) {
        if (chat[k] !== undefined) {
            const val = chat[k];
            return val === true || val === 1 || val === "on";
        }
    }
    return false;
}

let handler = async (m, { conn, isOwner, isAdmin }) => {
    if (!m.isGroup) return m.reply('⚠️ Este comando solo funciona en grupos');
    if (!isAdmin && !isOwner) return m.reply('⚠️ Solo los administradores pueden ver el panel');

    let chat = global.db.data.chats[m.chat] || {};

    // 🟦 Nueva presentación: más clara y ordenada
    let panel = `
╭━━━[ 📌 CONFIGURACIÓN DEL GRUPO ]━━━╮

🔰 *SEGURIDAD*
┃ 🔗 AntiLink: ${getChatValue(chat, 'antilink') ? '✅' : '❌'}
┃ 🔗 AntiLink2: ${getChatValue(chat, 'antilink2') ? '✅' : '❌'}
┃ 📡 AntiCanal: ${getChatValue(chat, 'anticanal') ? '✅' : '❌'}
┃ 🚫 AntiFake: ${getChatValue(chat, 'antifake') ? '✅' : '❌'}
┃ 🚫 AntiSpam: ${getChatValue(chat, 'antispam') ? '✅' : '❌'}
┃ 🤬 AntiTóxico: ${getChatValue(chat, 'antitoxic') ? '✅' : '❌'}
┃ 📵 AntiLlamada: ${getChatValue(chat, 'antillamada') ? '✅' : '❌'}
┃ 🤖 AntiBots: ${getChatValue(chat, 'antibot') ? '✅' : '❌'}

🛠️ *ADMINISTRACIÓN*
┃ 🛰️ Detect: ${getChatValue(chat, 'detect') ? '✅' : '❌'}
┃ 🛡️ SoloAdmins: ${getChatValue(chat, 'onlyadmin') ? '✅' : '❌'}
┃ 🌐 Modo Público: ${getChatValue(chat, 'public') ? '✅' : '❌'}

🎭 *MISCELÁNEOS*
┃ 👋 Welcome: ${getChatValue(chat, 'welcome') ? '✅' : '❌'}
┃ 👋 Despedida: ${getChatValue(chat, 'despedida') ? '✅' : '❌'}
┃ 🖼️ AutoSticker: ${getChatValue(chat, 'autosticker') ? '✅' : '❌'}
┃ 🔞 NSFW: ${getChatValue(chat, 'nsfw') ? '✅' : '❌'}
┃ 🎮 Juegos: ${getChatValue(chat, 'juegos') ? '✅' : '❌'}

╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📌 Escribe *.panel info* para saber cómo activar o configurar cada opción.
`.trim();

    m.reply(panel);
};

// 🔥 COMPATIBLE CON CUALQUIER LOADER
handler.help = ['panel'];
handler.tags = ['group'];
handler.command = ['panel'];
handler.register = true;

export default handler;
