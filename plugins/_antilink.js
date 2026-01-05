export async function before(m, { conn, isAdmin, isBotAdmin }) {
  if (!m.isGroup) return true;
  if (!isBotAdmin) return true;
  if (!m.message) return true;

  const chat = global.db.data.chats[m.chat];
  if (!chat?.antiLink) return true;

  const text =
    m.text ||
    m.message.conversation ||
    m.message.extendedTextMessage?.text ||
    m.message.caption ||
    "";

  if (!text) return true;

  const who = m.sender;
  const number = who.replace(/\D/g, "");

  const isOwner = owners.includes(number);
  const isGroupLink = groupLinkRegex.test(text);
  const isChannel = channelRegex.test(text);
  const isAnyLink = anyLinkRegex.test(text);
  const isAllowedLink = allowedLinks.test(text);
  const isTagall = text.includes(tagallLink);
  const isIG = igLinkRegex.test(text);
  const isClash = clashLinkRegex.test(text);

  async function deleteMessageSafe() {
    try {
      await conn.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          fromMe: false,
          id: m.key.id,
          participant: m.key.participant || m.sender,
        },
      });
    } catch {}
  }

  // 🔹 PERMITIR TODO A ADMINES
  if (isAdmin) return true; // ✅ Aquí permitimos cualquier link a admins

  // 🔹 TAGALL → eliminar siempre
  if (isTagall) {
    await deleteMessageSafe();
    await conn.sendMessage(m.chat, {
      text: `😮‍💨 Qué compartís el tagall inútil @${who.split("@")[0]}...`,
      mentions: [who],
    });
    return false;
  }

  // 🔥 ANTI-CANAL: borrar SIEMPRE EXCEPTO OWNER (admin ya está permitido)
  if (isChannel) {
    if (isOwner) return true; // PERMITIDO solo para owner
    await deleteMessageSafe();
    await conn.sendMessage(m.chat, {
      text: `🚫 Link de *canal* eliminado @${who.split("@")[0]}.`,
      mentions: [who],
    });
    return false;
  }

  // 🔹 Dueños: solo se les elimina link de otro grupo
  if (isOwner) {
    if (isGroupLink) {
      await deleteMessageSafe();
      await conn.sendMessage(m.chat, {
        text: `⚠️ Link de grupo eliminado aunque seas owner, @${who.split("@")[0]}.`,
        mentions: [who],
      });
    }
    return true;
  }

  // 🔹 PERMITIR links IG / Clash / allowed
  if (isIG || isClash || isAllowedLink) return true;

  // 🔹 Código del grupo
  let currentInvite = global.groupInviteCodes[m.chat];
  if (!currentInvite) {
    try {
      currentInvite = await conn.groupInviteCode(m.chat);
      global.groupInviteCodes[m.chat] = currentInvite;
    } catch {
      return true;
    }
  }

  // 🔹 Link del mismo grupo → permitido
  if (isGroupLink && text.includes(currentInvite)) return true;

  // 🔹 Link de OTRO grupo → eliminar + BAN si no es admin
  if (isGroupLink && !text.includes(currentInvite)) {
    await deleteMessageSafe();
    if (!isAdmin) {
      await conn.sendMessage(m.chat, {
        text: `🚫 @${who.split("@")[0]} fue *expulsado* por compartir un link de *otro grupo*.`,
        mentions: [who],
      });
      await conn.groupParticipantsUpdate(m.chat, [who], "remove");
    } else {
      await conn.sendMessage(m.chat, {
        text: `⚠️ @${who.split("@")[0]}, no compartas links de otros grupos.`,
        mentions: [who],
      });
    }
    return false;
  }

  // 🔹 Cualquier otro link → eliminar
  if (isAnyLink) {
    await deleteMessageSafe();
    await conn.sendMessage(m.chat, {
      text: `⚠️ @${who.split("@")[0]}, tu link fue eliminado (no permitido).`,
      mentions: [who],
    });
    return false;
  }

  return true;
}
