// plugins/grupo-configuracion.js - Panel con soporte de alias

// 🔥 Mapa de alias compatibles con tus plugins
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

    // 🆕 Nuevos agregados
    antilink2: ["antilink2", "antiLink2", "antilinks2"],
    anticanal: ["anticanal", "antiCanal", "antichannel", "antiChannel"]
};

// 🟣 Función que encuentra la propiedad correcta
function getChatValue(chat, key) {
    const keys = aliasMap[key];
    for (const k of keys) {
        if (chat[k] !== undefined) return chat[k];
    }
    return false;
}

let handler = async (m, { conn, isOwner, isAdmin }) => {
    if (!m.isGroup) return m.reply('⚠️ Este comando solo funciona en grupos');
    if (!isAdmin && !isOwner) return m.reply('⚠️ Solo los administradores pueden ver el panel');

    let chat = global.db.data.chats[m.chat] || {};

    let panel = `╭━━━[ PANEL DE CONFIGURACIÓN ]━━━╮
┃ 👋 Welcome: ${getChatValue(chat, 'welcome') ? '✅' : '❌'}
┃ 👋 Despedida: ${getChatValue(chat, 'despedida') ? '✅' : '❌'}
┃ 🔗 AntiLink: ${getChatValue(chat, 'antilink') ? '✅' : '❌'}
┃ 🔗 AntiLink2: ${getChatValue(chat, 'antilink2') ? '✅' : '❌'}
┃ 📡 AntiCanal: ${getChatValue(chat, 'anticanal') ? '✅' : '❌'}
┃ 🚫 AntiFake: ${getChatValue(chat, 'antifake') ? '✅' : '❌'}
┃ 🚫 AntiSpam: ${getChatValue(chat, 'antispam') ? '✅' : '❌'}
┃ 🤬 AntiTóxico: ${getChatValue(chat, 'antitoxic') ? '✅' : '❌'}
┃ 🛰️ Detect: ${getChatValue(chat, 'detect') ? '✅' : '❌'}
┃ 🖼️ AutoSticker: ${getChatValue(chat, 'autosticker') ? '✅' : '❌'}
┃ 🔞 NSFW: ${getChatValue(chat, 'nsfw') ? '✅' : '❌'}
┃ 🎮 Juegos: ${getChatValue(chat, 'juegos') ? '✅' : '❌'}
┃ 🌐 Modo Público: ${getChatValue(chat, 'public') ? '✅' : '❌'}
┃ 🛡️ SoloAdmins: ${getChatValue(chat, 'onlyadmin') ? '✅' : '❌'}
┃ 📵 AntiLlamada: ${getChatValue(chat, 'antillamada') ? '✅' : '❌'}
┃ 🤖 AntiBots: ${getChatValue(chat, 'antibot') ? '✅' : '❌'}
╰━━━━━━━━━━━━━━━━━━━━━━╯

Escribe *.panel info* para ver cómo activar o configurar cada función.`;

    m.reply(panel);
};

// 🔥 COMPATIBLE CON CUALQUIER LOADER
handler.help = ['panel'];
handler.tags = ['group'];

handler.command = ['panel'];
handler.command = handler.command || /^panel$/i;

handler.register = true;
handler.customPrefix = null;

export default handler;
