// plugins/afk.js — FelixCat_Bot 🐾

const handler = async (m, { conn, text, command }) => {
    try {
        if (!global.db.data.users[m.sender])
            global.db.data.users[m.sender] = {};

        let user = global.db.data.users[m.sender];

        if (command === 'afk') {
            let reason = text ? text.trim() : 'Sin especificar';

            user.afk = true;
            user.afkReason = reason;
            user.afkTime = Date.now();

            return conn.reply(
                m.chat,
                `🌙 *Modo AFK activado*\n` +
                `👤 @${m.sender.split("@")[0]}\n` +
                `🧩 Razón: _${reason}_\n⌛ Desde ahora.`,
                m,
                { mentions: [m.sender] }
            );
        }

    } catch (e) {
        console.log('Error AFK:', e);
    }
};

handler.command = ['afk'];
export default handler;


// ===============
// ▓ BEFORE GLOBAL
// ===============
export async function before(m, { conn }) {
    if (!m.isGroup && !m.isBaileys) {} // evitar loops
    if (!global.db.data.users[m.sender])
        global.db.data.users[m.sender] = {};

    let user = global.db.data.users[m.sender];

    // 🟢 Si el usuario estaba AFK y vuelve a escribir → desactivar
    if (user.afk) {
        let tiempo = Date.now() - user.afkTime;
        let seg = Math.floor(tiempo / 1000);
        let min = Math.floor(seg / 60);
        let hrs = Math.floor(min / 60);

        let tiempoTxt =
            hrs > 0
                ? `${hrs}h ${min % 60}m`
                : min > 0
                ? `${min}m`
                : `${seg}s`;

        user.afk = false;
        user.afkReason = '';
        user.afkTime = 0;

        await conn.reply(
            m.chat,
            `🌞 *Has vuelto @${m.sender.split("@")[0]}*\n` +
            `🕒 Estuviste AFK durante *${tiempoTxt}*`,
            m,
            { mentions: [m.sender] }
        );
    }

    // 🟡 Si mencionan a alguien AFK → avisar
    if (m.mentionedJid?.length) {
        for (let jid of m.mentionedJid) {
            let u = global.db.data.users[jid];
            if (!u?.afk) continue;

            let tiempo = Date.now() - u.afkTime;
            let seg = Math.floor(tiempo / 1000);
            let min = Math.floor(seg / 60);
            let hrs = Math.floor(min / 60);

            let tiempoTxt =
                hrs > 0
                    ? `${hrs}h ${min % 60}m`
                    : min > 0
                    ? `${min}m`
                    : `${seg}s`;

            await conn.reply(
                m.chat,
                `🌙 *Usuario AFK*\n` +
                `👤 @${jid.split("@")[0]}\n` +
                `🧩 Razón: _${u.afkReason}_\n` +
                `🕒 Tiempo: *${tiempoTxt}*`,
                m,
                { mentions: [jid] }
            );
        }
    }

    return true;
} 
