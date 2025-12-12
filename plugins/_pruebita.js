// ===============================
// RESPUESTAS LIMPIAS
// ===============================

// NOMBRE
if (chat.detect && m.messageStubType == 21) {
  await this.sendMessage(m.chat, { 
    text: nombre, 
    mentions: [usuario, ...groupAdmins.map(v => v.id)] 
  })
}

// FOTO
if (chat.detect && m.messageStubType == 22) {
  await this.sendMessage(m.chat, { 
    image: { url: pp }, 
    caption: foto, 
    mentions: [usuario, ...groupAdmins.map(v => v.id)] 
  })
}

// NUEVO LINK
if (chat.detect && m.messageStubType == 23) {
  await this.sendMessage(m.chat, { 
    text: newlink, 
    mentions: [usuario, ...groupAdmins.map(v => v.id)] 
  })
}

// DESCRIPCIÓN DEL GRUPO (24)
if (chat.detect && m.messageStubType == 24) {
  const descripcion = m.messageStubParameters[0] || "Sin descripción"
  const mensaje = `📝✨ ¡Descripción actualizada! ✨📝\n\n` +
  `🔧 Acción realizada por: @${usuario.split('@')[0]}\n\n` +
  `📄 Nueva descripción:\n*${descripcion}*`

  await this.sendMessage(m.chat, { 
    text: mensaje, 
    mentions: [usuario, ...groupAdmins.map(v => v.id)] 
  })
}

// EDIT CONFIG (25)
if (chat.detect && m.messageStubType == 25) {
  await this.sendMessage(m.chat, { 
    text: edit, 
    mentions: [usuario, ...groupAdmins.map(v => v.id)] 
  })
}

// STATUS (ABIERTO/CERRADO) (26)
if (chat.detect && m.messageStubType == 26) {
  await this.sendMessage(m.chat, { 
    text: status, 
    mentions: [usuario, ...groupAdmins.map(v => v.id)] 
  })
}

// RESTRICCIONES (27)
if (chat.detect && m.messageStubType == 27) {
  const modo = m.messageStubParameters[0] == 'on' 
    ? "🚫 Restricciones activadas\nSolo admins pueden modificar ajustes sensibles."
    : "✔️ Restricciones desactivadas\nTodos pueden modificar ajustes permitidos."

  const msg = `⚙️🔒 *Modo de restricciones del grupo* 🔒⚙️\n\n` +
              `${modo}\n\n👤 Acción: @${usuario.split('@')[0]}`

  await this.sendMessage(m.chat, {
    text: msg,
    mentions: [usuario, ...groupAdmins.map(v => v.id)]
  })
}

// APROBACIÓN REQUERIDA (28)
if (chat.detect && m.messageStubType == 28) {
  const modo = m.messageStubParameters[0] == 'on'
    ? "🟡 Ahora *se requiere aprobación* para entrar al grupo."
    : "🟢 *Ya no se requiere* aprobación para entrar."

  const msg = `🛂✨ *Actualización en solicitudes de entrada* ✨🛂\n\n` +
              `${modo}\n\n👤 Acción: @${usuario.split('@')[0]}`

  await this.sendMessage(m.chat, {
    text: msg,
    mentions: [usuario, ...groupAdmins.map(v => v.id)]
  })
}

// SOLICITUD ACEPTADA (31)
if (chat.detect && m.messageStubType == 31) {
  const quien = users.split('@')[0]
  const msg = `🟢✨ *Solicitud de entrada aceptada* ✨🟢\n\n` +
              `👤 Usuario aprobado: @${quien}\n` +
              `🔧 Aprobado por: @${usuario.split('@')[0]}`

  await this.sendMessage(m.chat, {
    text: msg,
    mentions: [usuario, users, ...groupAdmins.map(v => v.id)].filter(Boolean)
  })
}

// SOLICITUD RECHAZADA (32)
if (chat.detect && m.messageStubType == 32) {
  const quien = users.split('@')[0]
  const msg = `🔴❌ *Solicitud de entrada rechazada* ❌🔴\n\n` +
              `👤 Usuario rechazado: @${quien}\n` +
              `🔧 Acción por: @${usuario.split('@')[0]}`

  await this.sendMessage(m.chat, {
    text: msg,
    mentions: [usuario, users, ...groupAdmins.map(v => v.id)].filter(Boolean)
  })
}

// MENSAJES TEMPORALES (DISAPPEARING MESSAGES) (72)
if (chat.detect && m.messageStubType == 72) {
  const timer = m.messageStubParameters[0]
  const tiempoLegible = {
    "0": "❌ Desactivados",
    "86400": "1 día",
    "604800": "7 días",
    "7776000": "90 días"
  }[timer] || `${timer} segundos`

  const msg = `⏳✨ *Mensajes temporales actualizados* ✨⏳\n\n` +
              `🕒 Ahora los mensajes desaparecerán en: *${tiempoLegible}*\n` +
              `👤 Por: @${usuario.split('@')[0]}`

  await this.sendMessage(m.chat, {
    text: msg,
    mentions: [usuario, ...groupAdmins.map(v => v.id)]
  })
}

// NUEVO ADMIN (29)
if (chat.detect && m.messageStubType == 29) {
  await this.sendMessage(m.chat, { 
    text: admingp, 
    mentions: [usuario, users, ...groupAdmins.map(v => v.id)].filter(Boolean) 
  })
  return
}

// ADMIN REMOVIDO (30)
if (chat.detect && m.messageStubType == 30) {
  await this.sendMessage(m.chat, { 
    text: noadmingp, 
    mentions: [usuario, users, ...groupAdmins.map(v => v.id)].filter(Boolean) 
  })
}

// LOG EXTRA
else { 
  if (m.messageStubType == 2) return
  console.log({
    messageStubType: m.messageStubType,
    messageStubParameters: m.messageStubParameters,
    type: WAMessageStubType[m.messageStubType],
  })
}
