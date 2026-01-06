// 🔹 Regex
const groupLinkRegex = /chat.whatsapp.com\/(invite\/)?([0-9A-Za-z]{20,24})/i;
const channelRegex = /whatsapp\.com\/channel\/[0-9A-Za-z]{15,50}/i;

// Enlaces permitidos
const allowedLinks = /(tiktok.com|youtube.com|youtu.be|link.clashroyale.com)/i;
const tagallLink = "https://miunicolink.local/tagall-FelixCat";
const igLinkRegex = /(https?:\/\/)?(www.)?instagram.com\/[^\s]+/i;
const clashLinkRegex = /(https?:\/\/)?(link.clashroyale.com)\/[^\s]+/i;

// 🔹 Dueños exentos total
const owners = ["59896026646", "59898719147", "59892363485"];

// 🔹 Cache de códigos de invitación
if (!global.groupInviteCodes) global.groupInviteCodes = {};

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

  // 🛡️ ADMINES: todo permitido
  if (isAdmin) return true;

  // 🚫 TAGALL → eliminar siempre
  if (isTagall) {
    await deleteMessageSafe();
    await conn.sendMessage(m.chat, {
      text: `😮‍💨 Qué compartís el tagall inútil @${who.split("@")[0]}...`,
      mentions: [who],
    });
    return false;
  }

  // 🚫 ANTI-CANAL
  if (isChannel) {
    if (isOwner) return true;
    await deleteMessageSafe();
    await conn.sendMessage(m.chat, {
      text: `🚫 Link de *canal* eliminado @${who.split("@")[0]}.`,
      mentions: [who],
    });
    return false;
  }

  // 👑 OWNERS
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

  // ✅ Links permitidos
  if (isIG || isClash || isAllowedLink) return true;

  // 🔐 Obtener código del grupo
  let currentInvite = global.groupInviteCodes[m.chat];
  if (!currentInvite) {
    try {
      currentInvite = await conn.groupInviteCode(m.chat);
      global.groupInviteCodes[m.chat] = currentInvite;
    } catch {
      return true;
    }
  }

  // ✅ Link del mismo grupo
  if (isGroupLink && text.includes(currentInvite)) return true;

  // ❌ Link de OTRO grupo → eliminar + expulsar
  if (isGroupLink && !text.includes(currentInvite)) {
    await deleteMessageSafe();
    await conn.sendMessage(m.chat, {
      text: `🚫 @${who.split("@")[0]} fue *expulsado* por compartir un link de *otro grupo*.`,
      mentions: [who],
    });
    await conn.groupParticipantsUpdate(m.chat, [who], "remove");
    return false;
  }

  // 🟢 Todo lo demás queda permitido
  return true;
}
