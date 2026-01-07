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

  let [h, mnt] = time.split(":").map(Number)

  if (h > 23 || mnt > 59)
    return conn.reply(chat, `⏰ Hora inválida`, m)

  // Si ya tiene una alarma, la reemplazamos
  if (alarms[who]) {
    clearTimeout(alarms[who])
    delete alarms[who]
  }

  const now = new Date()
  const target = new Date()
  target.setHours(h, mnt, 0, 0)

  if (target <= now) target.setDate(target.getDate() + 1)

  const delay = target - now

  conn.reply(chat, `⏳ Alarma configurada para las *${time}*\n📝 Motivo: *${reason}*`, m)

  alarms[who] = setTimeout(() => {
    conn.sendMessage(chat, {
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
