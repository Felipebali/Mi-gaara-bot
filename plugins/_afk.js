let handler = async (m, { conn, text, args, user }) => {
  if (!m.isGroup) return
  if (!text) return m.reply("🛌 Usá así:\n.afk motivo")

  if (args.length >= 1) {
    text = args.join(" ")
  } else if (m.quoted?.text) {
    text = m.quoted.text
  } else return

  // ✅ Inicializar estructuras
  if (!user.inGroup) user.inGroup = {}
  if (!user.inGroup[m.chat]) user.inGroup[m.chat] = {}

  user.inGroup[m.chat].afk = Date.now()
  user.inGroup[m.chat].afkReason = text

  await m.reply(`🛌 AFK activado\n📝 Motivo: ${text}`)
}

// ✅ ASÍ LO QUIERE TU LOADER (ARRAY, NO REGEX)
handler.command = ["afk"]
handler.group = true
handler.botAdmin = true

// ✅ DETECTOR AUTOMÁTICO AFK
handler.before = async function (m, { conn, user }) {
  if (!m.isGroup) return
  if (!user) return
  if (user.banned) return

  if (!user.inGroup) user.inGroup = {}
  if (!user.inGroup[m.chat]) user.inGroup[m.chat] = {}

  const inGroup = user.inGroup[m.chat]

  const who =
    (m.mentionedJid && m.mentionedJid[0]) ||
    (m.quoted && m.quoted.sender) ||
    null

  // ✅ Sale del AFK cuando habla
  if (inGroup.afk > 0) {
    await m.reply(
      `✅ Ya no estás AFK\n📝 Motivo anterior: ${inGroup.afkReason || "Sin motivo"}`
    )

    inGroup.afk = -1
    inGroup.afkReason = ""
  }

  // ✅ Aviso si mencionan a alguien AFK
  if (who && who !== m.sender) {
    const hap = global.db?.data?.users?.[who]
    const whoAfk = hap?.inGroup?.[m.chat]
    const afkTime = whoAfk?.afk || 0

    if (afkTime > 0) {
      let tiempoInactivo = (Date.now() - afkTime) / 1000
      if (tiempoInactivo < 5) return

      let reason = whoAfk?.afkReason || "Sin motivo"

      await m.reply(
        `🛌 El usuario está AFK\n📝 Motivo: ${reason}\n⏱ Desde: ${new Date(
          whoAfk.afk
        ).toLocaleTimeString()}`
      )
    }
  }
}

export default handler
