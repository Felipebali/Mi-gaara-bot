let handler = async (m, { client, text, args, user }) => {
  if (!m.isGroup) return
  if (!text) return client.sendText(m.chat, txt.afk, m)

  if (args.length >= 1) {
    text = args.join(" ")
  } else if (m.quoted && m.quoted.text) {
    text = m.quoted.text
  } else return

  // ✅ Inicializa estructuras si no existen
  if (!user.inGroup) user.inGroup = {}
  if (!user.inGroup[m.chat]) user.inGroup[m.chat] = {}

  user.inGroup[m.chat].afk = Date.now()
  user.inGroup[m.chat].afkReason = text

  await client.sendText(
    m.chat,
    txt.afkSuccess(m.sender, text),
    fkontak
  )
}

handler.cmd = ["afk"]
handler.onlyGroup = true
handler.botAdmin = true

// ✅ DETECTOR AUTOMÁTICO
handler.before = async function (m, { client, user }) {
  if (!m.isGroup) return
  if (!user) return
  if (user.banned) return

  if (!user.inGroup) user.inGroup = {}
  if (!user.inGroup[m.chat]) user.inGroup[m.chat] = {}

  const inGroup = user.inGroup[m.chat]

  const who =
    (m.mentionedJid && m.mentionedJid[0]) ||
    (m.quoted && m.quoted.sender) ||
    m.sender

  // ✅ Sale del AFK cuando habla
  if (inGroup.afk > 0) {
    await client.sendText(
      m.chat,
      txt.afkOff(m.sender, inGroup.afkReason, inGroup.afk),
      null
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
      if (tiempoInactivo < 10) return

      let reason = whoAfk.afkReason || ""
      await client.sendText(
        m.chat,
        txt.afkOn(reason, whoAfk.afk),
        m
      )
    }
  }
}

export default handler
