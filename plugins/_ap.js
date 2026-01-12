// 📂 plugins/aprobar.js — Aprueba todas las solicitudes de una sola vez

let handler = async (m, { conn, isAdmin }) => {

  // 🧠 Obtener owners desde la config principal
  let owners = global.owner?.map(v => v.toString()) || []

  // 🧾 Normalizar número del que ejecuta
  let sender = m.sender.replace(/[^0-9]/g, '')

  // 🔒 Solo admins u owners
  if (!isAdmin && !owners.includes(sender)) return

  try {
    const pendingList = await conn.groupRequestParticipantsList(m.chat)

    if (!pendingList?.length) {
      return conn.sendMessage(m.chat, 
        { text: '✅ No hay solicitudes pendientes de aprobación.' }, 
        { quoted: null }
      )
    }

    // 🔥 Obtener todos los JID
    const users = pendingList.map(u => u.jid)

    // ⚡ Aprobar todos juntos
    await conn.groupRequestParticipantsUpdate(m.chat, users, 'approve')

    // 🧼 Mensaje limpio, sin cantidades
    await conn.sendMessage(m.chat,
      { text: '✅ Se han aprobado las solicitudes correctamente.' },
      { quoted: null }
    )

  } catch (err) {
    console.error('❌ Error al aprobar:', err)
    await conn.sendMessage(m.chat,
      { text: '⚠️ Error al aprobar solicitudes. Asegúrate de que el bot sea admin.' },
      { quoted: null }
    )
  }
}

handler.help = ['ap', 'aprobar']
handler.tags = ['group']
handler.command = ['ap', 'aprobar']
handler.group = true
handler.botAdmin = true

export default handler
