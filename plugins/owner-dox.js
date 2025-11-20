// 📂 plugins/doxear.js — Dox falso super realista (solo owners)

const owners = [
  '59898719147@s.whatsapp.net',
  '59896026646@s.whatsapp.net'
]

// Generador de IP de Uruguay
function randomUruguayIP() {
  const blocks = [
    [45, 232],     // Antel
    [168, 197],    // Claro
    [186, 52],     // Movistar
  ]
  const b = blocks[Math.floor(Math.random() * blocks.length)]
  return `${b[0]}.${b[1]}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`
}

// Direcciones falsas pero realistas de Uruguay
function randomAddress() {
  const dirs = [
    "Av. Italia 4321, Montevideo",
    "Bvar. Artigas 2567, Montevideo",
    "Camino Maldonado 998, Montevideo",
    "Calle 18 de Julio 1445, Maldonado",
    "Av. Roosevelt 3200, Punta del Este",
    "Av. Flores 765, Paysandú",
    "Sarandí 1320, Salto",
    "Av. Lavalleja 2101, Rivera"
  ]
  return dirs[Math.floor(Math.random() * dirs.length)]
}

// Proveedores reales de Uruguay (falsificado)
function randomISP() {
  const isps = [
    "Antel Fibra",
    "Claro Uruguay LTE",
    "Movistar Uruguay",
    "Dedicado S.A.",
    "Montevideo COMM"
  ]
  return isps[Math.floor(Math.random() * isps.length)]
}

// Departamentos para geolocalización
function randomDept() {
  const deps = [
    "Montevideo",
    "Maldonado",
    "Canelones",
    "San José",
    "Colonia",
    "Salto",
    "Paysandú",
    "Rivera",
    "Florida",
    "Rocha"
  ]
  return deps[Math.floor(Math.random() * deps.length)]
}

let handler = async (m, { conn, text }) => {
  try {
    // Permisos
    if (!owners.includes(m.sender))
      return m.reply(`🚫 No tienes permiso para usar este comando.`)

    let who
    if (m.isGroup) {
      if (m.mentionedJid?.length) who = m.mentionedJid[0]
      else if (m.quoted?.sender) who = m.quoted.sender
    }

    if (!who && text) {
      const num = text.replace(/[^0-9]/g, '')
      if (num) who = `${num}@s.whatsapp.net`
    }

    if (!who) who = m.sender

    // --- Ver si mandó ubicación real ---
    let realLoc = null

    if (m.quoted && m.quoted.message?.locationMessage) {
      realLoc = {
        lat: m.quoted.message.locationMessage.degreesLatitude,
        lon: m.quoted.message.locationMessage.degreesLongitude,
        name: m.quoted.message.locationMessage.name || "Ubicación enviada"
      }
    }

    // Datos falsos
    const fakeIP = randomUruguayIP()
    const fakeAddress = randomAddress()
    const fakeISP = randomISP()
    const fakeDept = randomDept()

    let texto

    if (realLoc) {
      // ------ UBICACIÓN REAL ENVIADA ------
      texto = 
`📍 *INFORME DE GEOLOCALIZACIÓN — DOX MODE*
──────────────────────────
👤 *Objetivo:* @${who.split('@')[0]}

📌 *Coordenadas reales detectadas:*
• Latitud: ${realLoc.lat}
• Longitud: ${realLoc.lon}
• Punto: ${realLoc.name}

🌐 *IP probable:* ${fakeIP}
🏢 *Proveedor:* ${fakeISP}
📡 *Antena conectada (${fakeDept}):* Sector LTE-UR-${Math.floor(Math.random()*999)}

🏠 *Dirección estimada según triangulación:*
${fakeAddress}
──────────────────────────
⚠️ Este dox es en un 89% real 🔒`
    } else {
      // ------ DOX FALSO COMPLETO ------
      texto =
`📍 *INFORME DE GEOLOCALIZACIÓN — DOX MODE*
──────────────────────────
👤 *Objetivo:* @${who.split('@')[0]}

🌐 *IP:* ${fakeIP}
🏢 *Proveedor:* ${fakeISP}
📡 *Antena registrada en:* ${fakeDept}

🏠 *Dirección asociada:*
${fakeAddress}

🗂️ *Host Reverse Lookup:* srv-${Math.floor(Math.random()*999)}.uy.net
🔍 *API Response:* status=OK | data.match=TRUE(1)
──────────────────────────
⚠️ Dox en un 89% real.`
    }

    await conn.sendMessage(m.chat, {
      text: texto,
      mentions: [who]
    })

  } catch (err) {
    console.error(err)
    m.reply("⚠️ Error en el comando.")
  }
}

handler.command = ["doxear"]
handler.tags = ["owner"]
handler.owner = true
handler.rowner = true

export default handler
