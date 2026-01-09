// 📂 plugins/aprobar.js — Aprueba todas las solicitudes de una sola vez

let handler = async (m, { conn, isAdmin }) => {
  const owners = ['59896026646', '59898719147', '59892363485']
  const sender = m.sender.split('@')[0]

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

    await conn.sendMessage(m.chat, 
      { text: `🎉 ${users.length} usuarios aprobados correctamente.` }, 
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
