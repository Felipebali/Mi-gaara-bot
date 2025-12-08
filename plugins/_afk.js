import { getUser, updateUser } from "../databaseFunctions.js";

let handler = async (m, { client, text, args, user }) => {
  if (!m.isGroup) return
  if (!text) return client.sendText(m.chat, txt.afk, m)

  if (args.length >= 1) {
    text = args.join(" ")
  } else if (m.quoted && m.quoted.text) {
    text = m.quoted.text
  } else return

  const newInGroup = {
    ...user.inGroup,
    [m.chat]: {
      ...user.inGroup[m.chat],
      afk: Date.now(),
      afkReason: text,
    },
  }

  await updateUser(m.sender, {
    inGroup: JSON.stringify(newInGroup),
  })

  await client.sendText(
    m.chat,
    txt.afkSuccess(m.sender, text),
    fkontak
  )
}

// ✅ COMANDO
handler.cmd = ["afk"]
handler.onlyGroup = true
handler.botAdmin = true

// ✅ DETECTOR AUTOMÁTICO (SALIDA AFK + AVISO SI LO MENCIONAN)
handler.before = async function (m, { client, user }) {
  if (!m.isGroup) return
  if (user.banned) return

  const who =
    (m.mentionedJid && m.mentionedJid[0]) ||
    (m.quoted && m.quoted.sender) ||
    m.sender

  const inGroup = user?.inGroup?.[m.chat]

  // ✅ SALE DEL AFK CUANDO HABLA
  if (inGroup?.afk > 0) {
    await client.sendText(
      m.chat,
      txt.afkOff(m.sender, inGroup.afkReason, inGroup.afk),
      null
    )

    const newInGroup = {
      ...user.inGroup,
      [m.chat]: {
        ...user.inGroup[m.chat],
        afk: -1,
        afkReason: "",
      },
    }

    await updateUser(m.sender, {
      inGroup: JSON.stringify(newInGroup),
    })
  }

  // ✅ AVISA SI MENCIONAN A ALGUIEN AFK
  if (who && who !== m.sender) {
    const hap = getUser(who)
    const whoAfk = hap?.inGroup?.[m.chat]
    const afkTime = whoAfk?.afk || 0

    if (afkTime && afkTime > 0) {
      let tiempoInactivo = (new Date() - afkTime) / 1000
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
