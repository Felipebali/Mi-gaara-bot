import { isBlacklisted, getBlacklist } from "../databaseFunctions.js";

let plugin = {};

plugin.groupParticipantsUpdate = async function (m, { client, isBotAdmin }) {
  try {
    if (!isBotAdmin) return;
    if (!m.isGroup) return;

    for (let user of m.participants) {

      // ✅ Verificar blacklist
      const banned = isBlacklisted(user);
      if (!banned) continue;

      // ✅ Obtener motivo
      const entry = getBlacklist().find(u => u.jid === user);
      const reason = entry?.reason || "Sin motivo";

      // ✅ Expulsar automáticamente
      await client.groupParticipantsUpdate(m.chat, [user], "remove");

      // ✅ Aviso al grupo
      await client.sendText(
        m.chat,
        txt.blackList(user, reason),
        null,
        { mentions: [user] }
      );
    }

  } catch (e) {
    console.error("Error en auto-kick al entrar (blacklist):", e);
  }
};

export default plugin; 
