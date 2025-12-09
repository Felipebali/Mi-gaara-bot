// -------------------------------
// AFK COMMAND
// -------------------------------

let handler = async (m, { conn, text, args, user }) => {
  if (!m.isGroup) return
  if (!text) return m.reply("🛌 Usá así:\n.afk motivo")

  if (args.length) text = args.join(" ")
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


// --------------------------------------------------------
// 🔥 DETECTOR UNIVERSAL AFK (FUNCIONA EN TODAS LAS RUTAS)
// --------------------------------------------------------

handler.before = async function (m, { conn, user }) {
  if (!m.isGroup) return
  if (!user || user.banned) return

  if (!user.inGroup) user.inGroup = {}
  if (!user.inGroup[m.chat]) user.inGroup[m.chat] = {}

  const inGroup = user.inGroup[m.chat]

  // -----------------------------------------
  // UNIVERSAL WHO DETECTOR 🔥
  // -----------------------------------------
  let who = null
  let context = null

  // 1️⃣ Buscar contextInfo en TODAS las posibles rutas
  try {
    context =
      m.msg?.contextInfo ||
      m.message?.extendedTextMessage?.contextInfo ||
      m.message?.conversation?.contextInfo ||
      m.message?.imageMessage?.contextInfo ||
      m.message?.videoMessage?.contextInfo ||
      m.message?.buttonsMessage?.contextInfo ||
      m.message?.interactiveResponseMessage?.contextInfo ||
      m.message?.templateButtonReplyMessage?.contextInfo ||
      null
  } catch (e) {}

  // 2️⃣ Detectar menciones reales
  if (context?.mentionedJid?.length > 0) {
    who = context.mentionedJid[0]
  }

  // 3️⃣ Detectar usuario citado
  else if (context?.participant) {
    who = context.participant
  }

  // ---------------------
  // 🚪 SALIR DE AFK
  // ---------------------
  if (inGroup.afk > 0) {
    await m.reply(
      `✅ Ya no estás AFK\n📝 Motivo anterior: ${inGroup.afkReason || "Sin motivo"}`
    )
    inGroup.afk = -1
    inGroup.afkReason = ""
  }

  // ---------------------
  // 📣 AVISAR AFK
  // ---------------------
  if (who && who !== m.sender) {
    const hap = global.db?.data?.users?.[who]
    if (!hap) return

    const whoAfk = hap?.inGroup?.[m.chat]
    const afkTime = whoAfk?.afk || 0

    if (afkTime > 0 && Date.now() - afkTime > 5000) {
      await m.reply(
        `🛌 *El usuario está AFK*\n📝 Motivo: ${whoAfk.afkReason || "Sin motivo"}\n⏱ Desde: ${new Date(
          afkTime
        ).toLocaleTimeString()}`
      )
    }
  }
}

export default handler
