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

    let panel = `
╭━━━[ 📌 CONFIGURACIÓN DEL GRUPO ]━━━╮

🔰 *SEGURIDAD*
┃ 🔗 AntiLink: ${getChatValue(chat, 'antilink') ? '✅' : '❌'}
┃    • Bloquea enlaces externos (grupos, webs, invitaciones).
┃ 🔗 AntiLink2: ${getChatValue(chat, 'antilink2') ? '✅' : '❌'}
┃    • Modo agresivo: elimina enlaces aunque estén ocultos.
┃ 📡 AntiCanal: ${getChatValue(chat, 'anticanal') ? '✅' : '❌'}
┃    • Bloquea enlaces de canales de WhatsApp.
┃ 🚫 AntiFake: ${getChatValue(chat, 'antifake') ? '✅' : '❌'}
┃    • Expulsa números falsos o con prefijos sospechosos.
┃ 🚫 AntiSpam: ${getChatValue(chat, 'antispam') ? '✅' : '❌'}
┃    • Detecta mensajes repetidos o spam masivo.
┃ 🤬 AntiTóxico: ${getChatValue(chat, 'antitoxic') ? '✅' : '❌'}
┃    • Filtra insultos, hateo y lenguaje inapropiado.
┃ 📵 AntiLlamada: ${getChatValue(chat, 'antillamada') ? '✅' : '❌'}
┃    • Expulsa usuarios que realizan llamadas al bot.
┃ 🤖 AntiBots: ${getChatValue(chat, 'antibot') ? '✅' : '❌'}
┃    • Bloquea otros bots que entran al grupo.

🛠️ *ADMINISTRACIÓN*
┃ 🛰️ Detect: ${getChatValue(chat, 'detect') ? '✅' : '❌'}
┃    • Notifica cuando alguien entra, sale o cambia info.
┃ 🛡️ SoloAdmins: ${getChatValue(chat, 'onlyadmin') ? '✅' : '❌'}
┃    • Solo admins pueden usar comandos en el grupo.
┃ 🌐 Modo Público: ${getChatValue(chat, 'public') ? '✅' : '❌'}
┃    • El bot responde a cualquiera (modo público activo).

🎭 *MISCELÁNEOS*
┃ 👋 Welcome: ${getChatValue(chat, 'welcome') ? '✅' : '❌'}
┃    • Mensaje de bienvenida para nuevos miembros.
┃ 👋 Despedida: ${getChatValue(chat, 'despedida') ? '✅' : '❌'}
┃    • Mensaje automático cuando alguien se va.
┃ 🖼️ AutoSticker: ${getChatValue(chat, 'autosticker') ? '✅' : '❌'}
┃    • Convierte imágenes enviadas en stickers.
┃ 🔞 NSFW: ${getChatValue(chat, 'nsfw') ? '✅' : '❌'}
┃    • Activa comandos de contenido +18.
┃ 🎮 Juegos: ${getChatValue(chat, 'juegos') ? '✅' : '❌'}
┃    • Habilita juegos y comandos de diversión.

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
