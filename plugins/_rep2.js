import { isBlacklisted, getBlacklist } from "../databaseFunctions.js";

let plugin = (m) => m;

plugin.before = async function (m, { client, isBotAdmin, isRAdmin }) {
  try {
    if (isRAdmin) return;
    if (!isBotAdmin) return;
    if (!m.isGroup) return;
    if (m.messageStubType) return;

    const sender = m.sender;

    // ✅ VERIFICAR SI ESTÁ EN BLACKLIST
    const isBanned = isBlacklisted(sender);
    if (!isBanned) return;

    // ✅ OBTENER MOTIVO
    const entry = getBlacklist().find(u => u.jid === sender);
    const reason = entry?.reason || "Sin motivo";

    // ✅ ELIMINAR MENSAJE
    await m.delete();

    // ✅ EXPULSAR
    await client.groupParticipantsUpdate(m.chat, [sender], "remove");

    // ✅ AVISO
    await client.sendText(
      m.chat,
      txt.blackList(sender, reason),
      null,
      { mentions: [sender] }
    );

    return true;
  } catch (err) {
    console.error("Error en autokick blacklist:", err);
  }
};

export default plugin;
