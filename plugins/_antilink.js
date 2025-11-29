const groupLinkRegex = /chat\.whatsapp\.com\/(?:invite\/)?([0-9A-Za-z]{20,24})/i;
const anyLinkRegex = /https?:\/\/[^\s]+/i;

const allowedLinks = /(tiktok\.com|youtube\.com|youtu\.be|link\.clashroyale\.com)/i;
const tagallLink = 'https://miunicolink.local/tagall-FelixCat';
const igLinkRegex = /(https?:\/\/)?(www\.)?instagram\.com\/[^\s]+/i;
const clashLinkRegex = /(https?:\/\/)?(link\.clashroyale\.com)\/[^\s]+/i;

if (!global.groupInviteCodes) global.groupInviteCodes = {};

const owners = ['59896026646', '59898719147', '59892363485'];

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
    '';

  if (!text) return true;

  const who = m.sender;
  const number = who.replace(/\D/g, '');

  const isGroupLink = groupLinkRegex.test(text);
  const isAnyLink = anyLinkRegex.test(text);
  const isAllowedLink = allowedLinks.test(text);
  const isTagall = text.includes(tagallLink);
  const isIG = igLinkRegex.test(text);
  const isClash = clashLinkRegex.test(text);
  const isCanal = /whatsapp\.com\/channel\//i.test(text); // Detecta canal

  async function deleteMessageSafe() {
    try {
      const deleteKey = {
        remoteJid: m.chat,
        fromMe: m.key.fromMe,
        id: m.key.id,
        participant: m.key.participant || m.participant || m.sender,
      };
      await conn.sendMessage(m.chat, { delete: deleteKey });
    } catch {}
  }

  // 🔹 Tagall → eliminar siempre
  if (isTagall) {
    await deleteMessageSafe();
    await conn.sendMessage(m.chat, {
      text: `😮‍💨 Qué compartís el tagall inútil @${who.split('@')[0]}...`,
      mentions: [who],
    });
    return false;
  }

  const isOwner = owners.includes(number);

  if (isOwner) {
    if (isGroupLink) {
      await deleteMessageSafe();
      await conn.sendMessage(m.chat, {
        text: `⚠️ Link de grupo eliminado aunque seas owner, @${who.split('@')[0]}.`,
        mentions: [who],
      });
    }
    return true;
  }

  if (isIG || isClash || isAllowedLink) return true;

  let currentInvite = global.groupInviteCodes[m.chat];
  if (!currentInvite) {
    try {
      currentInvite = await conn.groupInviteCode(m.chat);
      global.groupInviteCodes[m.chat] = currentInvite;
    } catch {
      return true;
    }
  }

  if (isGroupLink && text.includes(currentInvite)) return true;

  // ❌ Links de otros grupos
  if (isGroupLink && !text.includes(currentInvite)) {
    await deleteMessageSafe();
    if (!isAdmin) {
      await conn.sendMessage(m.chat, {
        text: `🚫 @${who.split('@')[0]} fue *expulsado* por compartir un link de *otro grupo*.`,
        mentions: [who],
      });
      await conn.groupParticipantsUpdate(m.chat, [who], 'remove');
    } else {
      await conn.sendMessage(m.chat, {
        text: `⚠️ @${who.split('@')[0]}, no compartas links de otros grupos.`,
        mentions: [who],
      });
    }
    return false;
  }

  // ❌ **Acá estaba la parte que BORRABA canales con isAnyLink**
  // ❌ La removí completamente
  //
  // if (isAnyLink && !isCanal) { ... }
  //
  // Ahora NO toca los canales.

  return true;
}
