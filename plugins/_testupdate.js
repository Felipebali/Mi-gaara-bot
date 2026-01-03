let handler = async (m, { conn }) => {
  const msg = `
🧪 *PLUGIN DE PRUEBA ACTIVO*

Si estás viendo este mensaje,
el sistema de actualización funciona correctamente 😎

📦 Repositorio sincronizado desde GitHub
♻️ Update funcionando
  `.trim()

  await conn.reply(m.chat, msg, m)
}

handler.command = ['testupdate', 'testup']
export default handler
