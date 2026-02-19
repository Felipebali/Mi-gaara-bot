import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

const dir = './database'
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const file = path.join(dir, 'fortunas.json')
if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({ usadas: [] }, null, 2))

const loadDB = () => JSON.parse(fs.readFileSync(file))
const saveDB = (data) => fs.writeFileSync(file, JSON.stringify(data, null, 2))

const frases = [
  "Algo bueno está por llegar a tu vida.",
  "Hoy es un gran día para intentar algo nuevo.",
  "Una sorpresa agradable te espera pronto.",
  "Confía en tu intuición, no fallará.",
  "Una oportunidad importante aparecerá.",
  "Tu esfuerzo dará frutos antes de lo que crees.",
  "La suerte favorece a los valientes.",
  "Un encuentro inesperado cambiará tu día.",
  "No temas tomar decisiones importantes.",
  "Un deseo que tienes se cumplirá.",
  "La felicidad está más cerca de lo que imaginas.",
  "Hoy recibirás buenas noticias.",
  "Un cambio positivo está en camino.",
  "La paciencia será tu mejor aliada.",
  "Alguien piensa mucho en ti.",
  "La fortuna sonríe a quien persevera.",
  "Un reto se convertirá en victoria.",
  "Tu energía atraerá cosas buenas.",
  "Confía en el proceso de la vida.",
  "El universo conspira a tu favor."
]

let handler = async (m, { conn }) => {

  let db = loadDB()
  if (!db.usadas) db.usadas = []

  if (db.usadas.length >= frases.length) db.usadas = []

  const disponibles = frases.filter(f => !db.usadas.includes(f))
  const frase = disponibles[Math.floor(Math.random() * disponibles.length)]

  db.usadas.push(frase)
  saveDB(db)

  const texto = `
🥠 *Galleta de la Fortuna*

"${frase}"

✨ El destino ha hablado...
`.trim()

  const img = await (await fetch('https://files.catbox.moe/xli6lh.jpg')).buffer()

  await conn.sendMessage(m.chat, {
    text: texto,
    contextInfo: {
      externalAdReply: {
        title: "🥠 Fortuna del día",
        body: "Mensaje del destino",
        thumbnail: img,
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  }, { quoted: m })
}

handler.help = ['fortuna']
handler.tags = ['fun']
handler.command = ['fortuna']

export default handler
