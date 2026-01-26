function isRealOwner(m) {
  const sender = m.sender?.split('@')[0]
  if (!sender) return false
  return global.owner.some(([id]) => id === sender)
}

let handler = async (m, { args, usedPrefix, command }) => {

  // 🔐 VALIDACIÓN REAL (IGNORA EL CORE)
  if (!isRealOwner(m)) {
    return m.reply('⛔ Este comando es exclusivo para *OWNERS*')
  }

  // ───── LISTAR OWNERS ─────
  if (command === 'listowner') {
    let txt = '👑 *OWNERS DEL BOT*\n\n'
    global.owner.forEach(([id, name], i) => {
      txt += `${i + 1}. 👤 ${name || 'Owner'}\n🆔 ${id}\n\n`
    })
    return m.reply(txt.trim())
  }

  // ───── VALIDAR MENCIÓN ─────
  if (!m.mentionedJid[0]) {
    return m.reply(
      `⚠️ Uso correcto:\n\n` +
      `${usedPrefix}aowner @usuario Nombre\n` +
      `${usedPrefix}rowner @usuario`
    )
  }

  const targetId = m.mentionedJid[0].split('@')[0]
  const name = args.slice(1).join(' ') || 'Owner'
  const mainOwner = global.owner[0][0]

  // ───── AGREGAR OWNER ─────
  if (command === 'aowner') {
    if (global.owner.some(([id]) => id === targetId)) {
      return m.reply('⚠️ Ese usuario ya es owner')
    }

    global.owner.push([targetId, name, true])

    return m.reply(
      `✅ *OWNER AGREGADO*\n\n` +
      `👤 ${name}\n🆔 ${targetId}\n\n` +
      `⚠️ *Reiniciá el bot para que tenga permisos*`
    )
  }

  // ───── QUITAR OWNER ─────
  if (command === 'rowner') {
    if (targetId === mainOwner) {
      return m.reply('🚫 No podés quitar al owner principal')
    }

    const index = global.owner.findIndex(([id]) => id === targetId)
    if (index === -1) {
      return m.reply('⚠️ Ese usuario no es owner')
    }

    global.owner.splice(index, 1)

    return m.reply(
      `🗑️ *OWNER ELIMINADO*\n\n🆔 ${targetId}\n\n` +
      `⚠️ *Reiniciá el bot para aplicar cambios*`
    )
  }
}

handler.help = ['aowner', 'rowner', 'listowner']
handler.tags = ['owner']
handler.command = ['aowner', 'rowner', 'listowner']
// 🚫 NO handler.owner
// 🚫 NO m.isOwner

export default handler
