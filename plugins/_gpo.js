// 📂 plugins/gpo.js — FIX OWNER 🔥

const ownerNumbers = [
  '59898719147',
  '59896026646',
  '59892363485', 
  '59899022028' 
]; // SOLO números

let handler = async (m, { conn }) => {
  try {
    const senderNumber = m.sender.replace(/[^0-9]/g, '');

    // Validar owner
    if (!ownerNumbers.includes(senderNumber)) {
      return m.reply('🚫 Solo los dueños del bot pueden usar este comando.');
    }

    const groupId = m.chat;

    // Obtener foto del grupo
    let ppUrl = null;
    try {
      ppUrl = await conn.profilePictureUrl(groupId, 'image').catch(() => null);
    } catch {}

    if (!ppUrl) return m.reply('❌ Este grupo no tiene foto de perfil.');

    await conn.sendMessage(
      m.chat,
      {
        image: { url: ppUrl },
        caption: '📸 Foto del grupo'
      },
      { quoted: m }
    );

  } catch (err) {
    console.error(err);
    m.reply('⚠️ Ocurrió un error al intentar descargar la foto del grupo.');
  }
};

handler.command = /^(gpo)$/i;
handler.tags = ['owner', 'tools'];
handler.help = ['gpo'];
handler.group = true;

export default handler;
