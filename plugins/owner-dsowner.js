let handler = async (m, { conn, args, usedPrefix, command }) => {

  // ───── Validación Owner ─────
  const senderNum = m.sender.split('@')[0]
  const isOwner = global.owner.some(([id]) => id === senderNum)

  if (!isOwner) {
    return m.reply('⛔ Este comando es exclusivo para *OWNERS*')
  }

  // ───── LISTAR OWNERS ─────
  if (command === 'listowner') {
    let texto = '👑 *LISTA DE OWNERS*\n\n'
    global.owner.forEach(([id, name], i) => {
      texto += `${i + 1}. 👤 ${name}\n📞 ${id}\n\n`
    })
    return m.reply(texto.trim())
  }

  // ───── Validar mención ─────
  if (!m.mentionedJid[0]) {
    return m.reply(`⚠️ Uso correcto:\n\n${usedPrefix}${command} @usuario Nombre(opcional)`)
  }

  const jid = m.mentionedJid[0]
  const numero = jid.split('@')[0]
  const nombre = args.slice(1).join(' ') || 'Owner'

  // Owner principal (el primero del config.js)
  const mainOwner = global.owner[0][0]

  // ───── AGREGAR OWNER ─────
  if (command === 'aowner') {
    if (global.owner.some(([id]) => id === numero)) {
      return m.reply('⚠️ Ese usuario *ya es owner*')
    }

    global.owner.push([numero, nombre, true])

    return m.reply(
      `✅ *OWNER AGREGADO*\n\n` +
      `👤 Nombre: ${nombre}\n` +
      `📞 ID: ${numero}`
    )
  }

  // ───── QUITAR OWNER ─────
  if (command === 'rowner') {
    if (numero === mainOwner) {
      return m.reply('🚫 No podés quitar al *OWNER PRINCIPAL*')
    }

    const index = global.owner.findIndex(([id]) => id === numero)
    if (index === -1) {
      return m.reply('⚠️ Ese usuario *no es owner*')
    }

    global.owner.splice(index, 1)

    return m.reply(
      `🗑️ *OWNER ELIMINADO*\n\n📞 ID: ${numero}`
    )
  }
}

handler.help = ['aowner', 'rowner', 'listowner']
handler.tags = ['owner']
handler.command = ['aowner', 'rowner', 'listowner']
handler.owner = true

export default handler
