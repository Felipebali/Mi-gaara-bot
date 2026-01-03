import fs from 'fs'

const FLAG = './.update_flag'

let handler = async (m, { conn }) => {
  fs.writeFileSync(FLAG, m.chat)

  await conn.reply(m.chat,
    '🔄 *Buscando actualizaciones en GitHub...*\n♻️ Reiniciando servidor...',
    m
  )

  setTimeout(() => process.exit(0), 1500)
}

// Se ejecuta cuando el plugin se vuelve a cargar
handler.before = async function (m, { conn }) {
  if (!fs.existsSync(FLAG)) return

  const chat = fs.readFileSync(FLAG, 'utf8')
  fs.unlinkSync(FLAG)

  await conn.sendMessage(chat, {
    text: '✅ *Bot iniciado correctamente.*\n📦 *Actualización completada desde GitHub.*'
  })
}

handler.command = ['update', 'up', 'fix']
handler.rowner = true
export default handler
