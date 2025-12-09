let handler = async (m, { conn, text, args, user }) => {
  if (!m.isGroup) return
  if (!text) return m.reply("🛌 Usá así:\n.afk motivo")

  if (args.length >= 1) text = args.join(" ")
  else if (m.quoted?.text) text = m.quoted.text
  else return

  if (!user.inGroup) user.inGroup = {}
  if (!user.inGroup[m.chat]) user.inGroup[m.chat] = {}

  user.inGroup[m.chat].afk = Date.now()
  user.inGroup[m.chat].afkReason = text

  await m.reply(`🛌 AFK activado\n📝 Motivo: ${text}`)
}

handler.command = ["afk"]
handler.group = true
handler.botAdmin = true


// ============================================
//         DETECTOR AUTOMÁTICO AFK FINAL
// ============================================

handler.before = async function (m, { conn, user }) {
  if (!m.isGroup) return
  if (!user || user.banned) return

  if (!user.inGroup) user.inGroup = {}
  if (!user.inGroup[m.chat]) user.inGroup[m.chat] = {}

  const inGroup = user.inGroup[m.chat]

  // ============================================
  //   🔍 DETECTOR UNIVERSAL DE MENCIÓN (REAL)
  // ============================================
  let who = null

  // 1. Mentions por contextInfo (tu loader usa esto)
  if (m.msg?.contextInfo?.mentionedJid?.length > 0) {
    who = m.msg.contextInfo.mentionedJid[0]
  }

  // 2. Menciones estándar
  else if (m.mentionedJid?.length > 0) {
    who = m.mentionedJid[0]
  }

  // 3. Mensaje citado
  else if (m.quoted) {
    who = m.quoted.sender || m.quoted.participant || null
  }

  // ============================================
  // 🚪 SALE DEL AFK SI HABLA
  // ============================================
  if (inGroup.afk > 0) {
    await m.reply(
      `✅ Ya no estás AFK\n📝 Motivo anterior: ${inGroup.afkReason || "Sin motivo"}`
    )

    inGroup.afk = -1
    inGroup.afkReason = ""
  }

  // ============================================
  // 📣 AVISO SI MENCIONAN A ALGUIEN AFK
  // ============================================
  if (who && who !== m.sender) {
    const hap = global.db?.data?.users?.[who]
    if (!hap) return

    const whoAfk = hap?.inGroup?.[m.chat]
    const afkTime = whoAfk?.afk || 0

    if (afkTime > 0) {
      let seconds = (Date.now() - afkTime) / 1000
      if (seconds < 5) return

      let reason = whoAfk?.afkReason || "Sin motivo"

      await m.reply(
        `🛌 *El usuario está AFK*\n📝 Motivo: ${reason}\n⏱ Desde: ${new Date(
          whoAfk.afk
        ).toLocaleTimeString()}`
      )
    }
  }
}

export default handler
