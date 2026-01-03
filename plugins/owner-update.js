let handler = async (m, { conn }) => {
  await conn.reply(m.chat,
    '🔄 *Actualizando bot...*\n♻️ Reiniciando servidor...',
    m
  )

  setTimeout(() => {
    process.exit(0)
  }, 1500)
}

handler.command = ['update', 'up', 'fix']
handler.rowner = true
export default handler
