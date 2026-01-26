let handler = async (m, { args, usedPrefix, command }) => {

  // ✅ Validación REAL del bot
  if (!m.isOwner) {
    return m.reply('⛔ Comando exclusivo para *OWNERS*')
  }

  // ───── LISTAR OWNERS ─────
  if (command === 'listowner') {
    let txt = '👑 *OWNERS DEL BOT*\n\n'
    global.owner.forEach(([id, name], i) => {
      txt += `${i + 1}. 👤 ${name}\n🆔 ${id}\n\n`
    })
    return m.reply(txt.trim())
  }

  if (!m.mentionedJid[0]) {
    return m.reply(`⚠️ Uso correcto:\n\n${usedPrefix}${command} @usuario Nombre(opcional)`)
  }

  const jid = m.mentionedJid[0]
  const id = jid.split('@')[0]
  const name = args.slice(1).join(' ') || 'Owner'

  const mainOwner = global.owner[0][0]

  // ───── AGREGAR OWNER ─────
  if (command === 'aowner') {
    if (global.owner.some(([o]) => o === id)) {
      return m.reply('⚠️ Ese usuario ya es owner')
    }

    global.owner.push([id, name, true])

    return m.reply(
      `✅ *OWNER AGREGADO*\n\n` +
      `👤 ${name}\n🆔 ${id}\n\n` +
      `⚠️ *Reinicia el bot para que tome efecto*`
    )
  }

  // ───── QUITAR OWNER ─────
  if (command === 'rowner') {
    if (id === mainOwner) {
      return m.reply('🚫 No podés quitar al owner principal')
    }

    const index = global.owner.findIndex(([o]) => o === id)
    if (index === -1) {
      return m.reply('⚠️ Ese usuario no es owner')
    }

    global.owner.splice(index, 1)

    return m.reply(
      `🗑️ *OWNER ELIMINADO*\n\n🆔 ${id}\n\n` +
      `⚠️ *Reinicia el bot para que tome efecto*`
    )
  }
}

handler.help = ['aowner', 'rowner', 'listowner']
handler.tags = ['owner']
handler.command = ['aowner', 'rowner', 'listowner']
// handler.owner = true

export default handler
