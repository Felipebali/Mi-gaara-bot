// plugins/spam.js — FelixCat_Bot 🐾

// Owners permitidos
const owners = ["59896026646@s.whatsapp.net", "59898719147@s.whatsapp.net"];

let handler = async (m, { conn, text }) => {
    if (!owners.includes(m.sender)) 
        return m.reply("❌ Solo los dueños pueden usar este comando.");

    if (!text) 
        return m.reply("❌ Usa: .spam <mensaje>");

    try {
        // Obtener todos los grupos donde está el bot
        let groups = Object.entries(conn.chats)
            .filter(([jid, chat]) => jid.endsWith("@g.us"));

        if (!groups.length) 
            return m.reply("❌ El bot no está en ningún grupo.");

        m.reply(`📢 Enviando spam a *${groups.length} grupos* con mención oculta...`);

        for (let [jid, group] of groups) {
            // Obtener participantes del grupo
            let metadata = await conn.groupMetadata(jid);
            let participantes = metadata.participants.map(v => v.id);

            // ✨ Enviar mensaje con mención oculta a todos
            await conn.sendMessage(jid, { 
                text: text,
                mentions: participantes // mención fantasma
            });

            // Pausa para evitar bloqueo
            await new Promise(r => setTimeout(r, 800));
        }

        m.reply("✔️ Spam enviado exitosamente a todos los grupos.");

    } catch (e) {
        console.error(e);
        m.reply("❌ Error al enviar el spam.");
    }
};

handler.help = ["spam"];
handler.tags = ["owner"];
handler.command = /^spam$/i;

export default handler;
