let handler = async (m, { conn, args, usedPrefix, command }) => {

  // ───── Normalizar sender ─────
  const sender = m.sender.split('@')[0]

  // ───── Verificar owner (número o LID) ─────
  const isOwner = global.owner.some(([id]) => id === sender)

  if (!isOwner) {
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

  // ───── Validar mención ─────
  if (!m.mentionedJid[0]) {
    return m.reply(`⚠️ Uso correcto:\n\n${usedPrefix}${command} @usuario Nombre(opcional)`)
  }

  const targetJid = m.mentionedJid[0]
  const targetId = targetJid.split('@')[0]
  const name = args.slice(1).join(' ') || 'Owner'

  // Owner principal (primer número del config)
  const mainOwner = global.owner[0][0]

  // ───── AGREGAR OWNER ─────
  if (command === 'aowner') {
    if (global.owner.some(([id]) => id === targetId)) {
      return m.reply('⚠️ Ese usuario ya es *owner*')
    }

    global.owner.push([targetId, name, true])

    return m.reply(
      `✅ *OWNER AGREGADO*\n\n` +
      `👤 Nombre: ${name}\n` +
      `🆔 ID: ${targetId}`
    )
  }

  // ───── QUITAR OWNER ─────
  if (command === 'rowner') {
    if (targetId === mainOwner) {
      return m.reply('🚫 No podés quitar al *OWNER PRINCIPAL*')
    }

    const index = global.owner.findIndex(([id]) => id === targetId)
    if (index === -1) {
      return m.reply('⚠️ Ese usuario no es owner')
    }

    global.owner.splice(index, 1)

    return m.reply(
      `🗑️ *OWNER ELIMINADO*\n\n🆔 ID: ${targetId}`
    )
  }
}

handler.help = ['aowner', 'rowner', 'listowner']
handler.tags = ['owner']
handler.command = ['aowner', 'rowner', 'listowner']
handler.owner = false // ⚠️ IMPORTANTE

export default handler
