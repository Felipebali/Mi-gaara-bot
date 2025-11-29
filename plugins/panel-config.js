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

// 🟣 Obtener valores seguros
function getChatValue(chat, key) {
    const keys = aliasMap[key];
    if (!keys) return false;
    for (const k of keys) {
        if (chat[k] !== undefined) {
            return chat[k] === true || chat[k] === 1 || chat[k] === "on";
        }
    }
    return false;
}

let handler = async (m, { conn, isOwner, isAdmin }) => {
    if (!m.isGroup) return m.reply('⚠️ Este comando solo funciona en grupos');
    if (!isAdmin && !isOwner) return m.reply('⚠️ Solo los administradores pueden ver el panel');

    let chat = global.db.data.chats[m.chat] || {};

    let panel = `
╭━━━[ 📌 CONFIGURACIÓN DEL GRUPO ]━━━╮
Cada opción se activa/desactiva usando:
➡️  *.<comando>*  (ej: *.antilink*)

🔰 *SEGURIDAD*
┃ 🔗 AntiLink: ${getChatValue(chat, 'antilink') ? '✅' : '❌'}
┃    • Bloquea enlaces comunes.
┃    • Cmd: *.antilink*

┃ 🔗 AntiLink2: ${getChatValue(chat, 'antilink2') ? '✅' : '❌'}
┃    • Detector avanzado de enlaces.
┃    • Cmd: *.antilink2*

┃ 📡 AntiCanal: ${getChatValue(chat, 'anticanal') ? '✅' : '❌'}
┃    • Bloquea enlaces de canales de WhatsApp.
┃    • Cmd: *.anticanal*

┃ 🚫 AntiFake: ${getChatValue(chat, 'antifake') ? '✅' : '❌'}
┃    • Expulsa números falsos.
┃    • Cmd: *.antifake*

┃ 🚫 AntiSpam: ${getChatValue(chat, 'antispam') ? '✅' : '❌'}
┃    • Evita spam y mensajes repetidos.
┃    • Cmd: *.antispam*

┃ 🤬 AntiTóxico: ${getChatValue(chat, 'antitoxic') ? '✅' : '❌'}
┃    • Filtra insultos.
┃    • Cmd: *.antitoxic*

┃ 📵 AntiLlamada: ${getChatValue(chat, 'antillamada') ? '✅' : '❌'}
┃    • Bloquea y expulsa por llamar al bot.
┃    • Cmd: *.antillamada*

┃ 🤖 AntiBots: ${getChatValue(chat, 'antibot') ? '✅' : '❌'}
┃    • Evita que entren otros bots.
┃    • Cmd: *.antibot*


🛠️ *ADMINISTRACIÓN*
┃ 🛰️ Detect: ${getChatValue(chat, 'detect') ? '✅' : '❌'}
┃    • Avisos de entradas/salidas/cambios.
┃    • Cmd: *.detect*

┃ 🛡️ SoloAdmins: ${getChatValue(chat, 'onlyadmin') ? '✅' : '❌'}
┃    • Solo admins pueden usar comandos.
┃    • Cmd: *.modoadmin*

┃ 🌐 Público: ${getChatValue(chat, 'public') ? '✅' : '❌'}
┃    • Bot accesible para todos.
┃    • Cmd: *.public*


🎭 *MISCELÁNEOS*
┃ 👋 Welcome: ${getChatValue(chat, 'welcome') ? '✅' : '❌'}
┃    • Mensaje de bienvenida.
┃    • Cmd: *.welcome*

┃ 👋 Despedida: ${getChatValue(chat, 'despedida') ? '✅' : '❌'}
┃    • Mensaje de salida.
┃    • Cmd: *.despedida*

┃ 🖼️ AutoSticker: ${getChatValue(chat, 'autosticker') ? '✅' : '❌'}
┃    • Convierte imágenes en sticker.
┃    • Cmd: *.autosticker*

┃ 🔞 NSFW: ${getChatValue(chat, 'nsfw') ? '✅' : '❌'}
┃    • Contenido +18.
┃    • Cmd: *.nsfw*

┃ 🎮 Juegos: ${getChatValue(chat, 'juegos') ? '✅' : '❌'}
┃    • Juegos y diversión.
┃    • Cmd: *.juegos*

╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📘 Usa *.panel info* para ver detalles de cada módulo.
`.trim();

    m.reply(panel);
};

handler.help = ['panel', 'config'];
handler.tags = ['group'];
handler.command = ['panel', 'config'];
handler.register = true;

export default handler;
