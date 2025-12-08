let handler = async (m, { conn, text, args, user }) => {
  if (!m.isGroup) return
  if (!text) return m.reply(txt?.afk || "🛌 Escribí un motivo para tu AFK.")

  if (args.length >= 1) {
    text = args.join(" ")
  } else if (m.quoted?.text) {
    text = m.quoted.text
  } else return

  if (!user.inGroup) user.inGroup = {}
  if (!user.inGroup[m.chat]) user.inGroup[m.chat] = {}

  user.inGroup[m.chat].afk = Date.now()
  user.inGroup[m.chat].afkReason = text

  await m.reply(
    txt?.afkSuccess
      ? txt.afkSuccess(m.sender, text)
      : `🛌 AFK activado\nMotivo: ${text}`
  )
}

// ✅ TU LOADER USA ESTO:
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

  // ✅ Sale del AFK al hablar
  if (inGroup.afk > 0) {
    await m.reply(
      txt?.afkOff
        ? txt.afkOff(m.sender, inGroup.afkReason, inGroup.afk)
        : `✅ Dejaste de estar AFK`
    )

    inGroup.afk = -1
    inGroup.afkReason = ""
  }

  // ✅ Aviso si mencionan AFK
  if (who && who !== m.sender) {
    const hap = global.db?.data?.users?.[who]
    const whoAfk = hap?.inGroup?.[m.chat]
    const afkTime = whoAfk?.afk || 0

    if (afkTime > 0) {
      let tiempoInactivo = (Date.now() - afkTime) / 1000
      if (tiempoInactivo < 5) return

      let reason = whoAfk?.afkReason || "Sin motivo"

      await m.reply(
        txt?.afkOn
          ? txt.afkOn(reason, whoAfk.afk)
          : `🛌 El usuario está AFK\n⏱ Motivo: ${reason}`
      )
    }
  }
}

export default handler
