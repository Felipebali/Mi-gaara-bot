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


// =====================================
//    BEFORE — DETECTAR AFK AUTOMÁTICO
// =====================================
handler.before = async (m, { conn }) => {
    try {
        if (!global.db?.data?.users[m.sender])
            global.db.data.users[m.sender] = {};

        let user = global.db.data.users[m.sender];

        // 🟢 SI EL USUARIO ESTABA AFK Y ESCRIBE → QUITAR AFK
        if (user.afk && !m.isBaileys) {

            let tiempo = Date.now() - user.afkTime;

            let seg = Math.floor(tiempo / 1000);
            let min = Math.floor(seg / 60);
            let hrs = Math.floor(min / 60);

            let tiempoTxt =
                hrs > 0 ? `${hrs}h ${min % 60}m`
                : min > 0 ? `${min}m`
                : `${seg}s`;

            user.afk = false;
            user.afkReason = '';
            user.afkTime = 0;

            await conn.reply(
                m.chat,
                `🌞 *Has dejado el AFK, @${m.sender.split("@")[0]}*\n` +
                `🕒 Tiempo AFK: *${tiempoTxt}*`,
                m,
                { mentions: [m.sender] }
            );
        }

        // 🟡 AVISAR SI SE MENCIONA A ALGUIEN QUE ESTÁ AFK
        if (m.mentionedJid?.length) {
            for (let jid of m.mentionedJid) {
                let u = global.db.data.users[jid];
                if (!u?.afk) continue;

                let tiempo = Date.now() - u.afkTime;
                let seg = Math.floor(tiempo / 1000);
                let min = Math.floor(seg / 60);
                let hrs = Math.floor(min / 60);

                let tiempoTxt =
                    hrs > 0 ? `${hrs}h ${min % 60}m`
                    : min > 0 ? `${min}m`
                    : `${seg}s`;

                await conn.reply(
                    m.chat,
                    `🌙 *Este usuario está AFK*\n` +
                    `👤 @${jid.split("@")[0]}\n` +
                    `🧩 Razón: _${u.afkReason}_\n` +
                    `🕒 Hace: *${tiempoTxt}*`,
                    m,
                    { mentions: [jid] }
                );
            }
        }

        return true;

    } catch (e) { }
};
