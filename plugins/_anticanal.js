// plugins/anticanal.js
// Anti-enlace de canales + comando .anticanal

let groupLinkRegex = /chat.whatsapp/i
let channelLinkRegex = /whatsapp.com\/channel/i

let plugin = (m) => m

plugin.before = async function (m, { client, participants, isAdmin, isBotAdmin, isOwner, chat }) {
  if (!m.isGroup) return
  if (isAdmin || isOwner) return

  const groupAdmins = participants.filter((p) => p.admin)
  let isChannelLink = channelLinkRegex.exec(m.text)

  // -------------------------------------------------------
  // 🔥 ANTI CANALES (solo si está activado en este grupo)
  // -------------------------------------------------------
  if (chat.antiChannels && isChannelLink) {
    // Si el bot NO es admin → solo avisa
    if (!isBotAdmin) {
      return client.sendText(
        m.chat,
        `🚫 *No se permiten links de canales en este grupo*\n\n@${m.sender.split("@")[0]}`,
        null,
        { mentions: [m.sender, ...groupAdmins.map((v) => v.id)] }
      )
    }

    // Si chat.delete está activado → borra mensaje
    if (chat.delete) {
      await client.sendText(
        m.chat,
        `🗑️ Mensaje eliminado — link de canal detectado.\n@${m.sender.split("@")[0]}`,
        null,
        { mentions: [m.sender, ...groupAdmins.map((v) => v.id)] }
      )
      return await m.delete()
    }

    // Si el bot ES admin → avisa y elimina al usuario (opcional)
    await client.sendText(
      m.chat,
      `❌ *Enlace de canal detectado*\nUsuario: @${m.sender.split("@")[0]}`,
      null,
      { mentions: [m.sender, ...groupAdmins.map((v) => v.id)] }
    )

    // si querés expulsión, descomenta
    //await client.groupParticipantsUpdate(m.chat, [m.sender], "remove")
  }

  return
}

plugin.command = /^anticanal$/i
plugin.botAdmin = false
plugin.admin = true
plugin.owner = false

plugin.handler = async (m, { client, chat, isAdmin }) => {
  if (!isAdmin) return client.sendText(m.chat, "❌ Solo los administradores pueden usar este comando.", m)

  // Cambiar estado
  chat.antiChannels = !chat.antiChannels

  await client.sendText(
    m.chat,
    `📢 *Anti-canales ahora está:* ${chat.antiChannels ? "🟢 ACTIVADO" : "🔴 DESACTIVADO"}`,
    m
  )
}

export default plugin
