import fs from 'fs'

const DIR = './database'
const DB = `${DIR}/alarms.json`

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR)
if (!fs.existsSync(DB)) fs.writeFileSync(DB, '{}')

function load() {
  return JSON.parse(fs.readFileSync(DB))
}
function save(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2))
}

// 🧭 Control de ejecución
let lastCheck = 0

export default {

  // ─────────────────────────
  // 🧭 Verificador global (como tu mentionBackup)
  // ─────────────────────────
  before: async ({ conn }) => {
    try {
      const now = Date.now()

      // revisar cada 5 segundos
      if (now - lastCheck < 5000) return false
      lastCheck = now

      let data = load()
      let changed = false

      for (let user in data) {
        if (now >= data[user].time) {
          const { chat, reason } = data[user]

          await conn.sendMessage(chat, {
            text: `⏰ *ALARMA*\n\n👤 @${user.split('@')[0]}\n📝 ${reason}`,
            mentions: [user]
          })

          delete data[user]
          changed = true
        }
      }

      if (changed) save(data)
      return false

    } catch (e) {
      console.error('❌ Error alarma:', e.message)
      return false
    }
  },

  // ─────────────────────────
  // 🕰️ Handler del comando
  // ─────────────────────────
  handler: async (m, { conn, text, command }) => {

    const who = m.sender
    const chat = m.chat
    let data = load()

    // ❌ Cancelar alarma
    if (command === 'can') {
      if (!data[who]) return m.reply('❌ No tienes ninguna alarma activa')

      delete data[who]
      save(data)
      return m.reply('🛑 Alarma cancelada correctamente')
    }

    // ⏰ Crear alarma
    if (!text) return m.reply('🕰️ Uso:\n.alarma 19:30 Tomar agua')

    const [time, ...reasonArr] = text.split(' ')
    const reason = reasonArr.join(' ').trim()

    if (!time || !reason) return m.reply('❌ Formato incorrecto')
    if (!/^\d{1,2}:\d{2}$/.test(time)) return m.reply('⏰ Hora inválida')

    let [h, min] = time.split(':').map(Number)
    if (h > 23 || min > 59) return m.reply('⏰ Hora inválida')

    const now = new Date()
    const target = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      h, min, 0, 0
    )

    if (target <= now) target.setDate(target.getDate() + 1)

    data[who] = { time: target.getTime(), reason, chat }
    save(data)

    await conn.sendMessage(chat, {
      text: `⏳ Alarma programada para *${time}*\n📝 ${reason}\n👤 @${who.split('@')[0]}`,
      mentions: [who]
    })
  }
}

// ─────────────────────────
export const command = ['alarma', 'can']
export const tags = ['tools']
export const help = ['alarma <hora> <motivo>', 'can']
