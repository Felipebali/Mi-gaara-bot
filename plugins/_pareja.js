let handler = async (m, { conn }) => {

  const getUser = (jid) => {
    if (!global.db.data.users[jid]) {
      global.db.data.users[jid] = {
        pareja: null,
        estado: 'soltero',
        propuesta: null,
        relacionFecha: null,
        matrimonioFecha: null,
        amor: 0
      }
    }
    return global.db.data.users[jid]
  }

  const sender = m.sender
  const senderUser = getUser(sender)

  // Obtener target
  let target = null

  if (m.mentionedJid?.length) {
    target = m.mentionedJid[0]
  } else if (m.quoted?.sender) {
    target = m.quoted.sender
  }

  if (!target) return m.reply('💌 Menciona a la persona.\nEjemplo:\n.pareja @usuario')

  if (target === sender)
    return m.reply('🤨 No podés ser tu propia pareja.')

  const targetUser = getUser(target)

  // Validaciones
  if (senderUser.pareja)
    return m.reply('❌ Ya estás en una relación.')

  if (targetUser.pareja)
    return m.reply('❌ Esa persona ya tiene pareja.')

  if (targetUser.propuesta)
    return m.reply('⏳ Esa persona ya tiene una propuesta pendiente.')

  // Guardar propuesta
  targetUser.propuesta = {
    from: sender,
    tipo: 'novios',
    fecha: Date.now()
  }

  await conn.reply(
    m.chat,
    `💌 *PROPUESTA DE NOVIAZGO*

👤 @${sender.split('@')[0]} quiere ser pareja de
💞 @${target.split('@')[0]}

Responde con:

✅ .aceptar  
❌ .rechazar`,
    m,
    { mentions: [sender, target] }
  )
}

handler.command = ['pareja']

export default handler
