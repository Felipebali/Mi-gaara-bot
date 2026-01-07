// 🕰️ Alarma personal — FelixCat_Bot

const alarms = {}  // { jid: timeoutID }

const handler = async (m, { conn, text, command }) => {
  const who = m.sender
  const chat = m.chat

  // ─────────────────────────
  // ❌ Cancelar alarma
  // ─────────────────────────
  if (command === 'can') {
    if (!alarms[who])
      return conn.reply(chat, `❌ No tienes ninguna alarma activa`, m)

    clearTimeout(alarms[who])
    delete alarms[who]

    return conn.reply(chat, `🛑 Alarma cancelada correctamente`, m)
  }

  // ─────────────────────────
  // ⏰ Crear alarma
  // ─────────────────────────
  if (!text)
    return conn.reply(chat, `🕰️ Uso:\n.alarma 19:30 Motivo`, m)

  const [time, ...reasonArr] = text.split(" ")
  const reason = reasonArr.join(" ").trim()

  if (!time || !reason)
    return conn.reply(chat, `❌ Formato incorrecto\nEjemplo:\n.alarma 19:30 Tomar agua`, m)

  if (!/^\d{1,2}:\d{2}$/.test(time))
    return conn.reply(chat, `⏰ Hora inválida (usa HH:MM)`, m)

  let [h, min] = time.split(":").map(Number)
  if (h > 23 || min > 59)
    return conn.reply(chat, `⏰ Hora inválida`, m)

  // Reemplazar alarma previa
  if (alarms[who]) {
    clearTimeout(alarms[who])
    delete alarms[who]
  }

  // 🧠 Tomar fecha actual y fijar la hora
  const now = new Date()
  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    h, min, 0, 0
  )

  // Si ya pasó hoy, programar para mañana
  if (target <= now) target.setDate(target.getDate() + 1)

  const delay = target - now

  await conn.sendMessage(chat, {
    text: `⏳ Alarma programada para *${time}*\n📝 ${reason}\n👤 @${who.split("@")[0]}`,
    mentions: [who]
  }, { quoted: m })

  alarms[who] = setTimeout(async () => {
    await conn.sendMessage(chat, {
      text: `⏰ *ALARMA*\n\n👤 @${who.split("@")[0]}\n📝 ${reason}`,
      mentions: [who]
    })
    delete alarms[who]
  }, delay)
}

handler.command = ['alarma', 'can']
handler.tags = ['tools']
handler.help = ['alarma <hora> <motivo>', 'can']

export default handler
