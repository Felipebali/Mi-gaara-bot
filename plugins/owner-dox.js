// 📂 plugins/doxear.js — DOX falso hiperrealista (solo owners)

const owners = [
  '59898719147@s.whatsapp.net',
  '59896026646@s.whatsapp.net'
]

// Bloques IP Uruguay + ASN correctos (solo imitación)
const uruguayProviders = [
  { name: "Antel", ipStart: "179.27", asn: "AS6057", org: "Administración Nacional de Telecomunicaciones" },
  { name: "Claro Uruguay", ipStart: "190.64", asn: "AS27862", org: "América Móvil Uruguay" },
  { name: "Movistar Uruguay", ipStart: "186.52", asn: "AS28000", org: "Telefónica Móviles Uruguay" }
]

function randomProvider() {
  return uruguayProviders[Math.floor(Math.random() * uruguayProviders.length)]
}

function randomIP(prefix) {
  return `${prefix}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`
}

function randomAddress() {
  const dirs = [
    "Av. Italia 4123, Parque Batlle, Montevideo",
    "Bvar. Artigas 2567, Tres Cruces, Montevideo",
    "Av. Roosevelt 3201, Punta del Este, Maldonado",
    "Calle 18 de Julio 1445, Centro, Maldonado",
    "Sarandí 1320, Salto",
    "Av. Lavalleja 2101, Rivera"
  ]
  return dirs[Math.floor(Math.random() * dirs.length)]
}

// Coordenadas falsas Montevideo/Maldonado 70%
function randomCoordinates() {
  const chance = Math.random()

  if (chance < 0.7) {
    // Montevideo / Maldonado (más creíble para bots uruguayos)
    const zones = [
      { lat: -34.905, lon: -56.191 }, // Centro Montevideo
      { lat: -34.897, lon: -56.164 }, // Pocitos
      { lat: -34.916, lon: -56.159 }, // Buceo
      { lat: -34.962, lon: -54.948 }  // Maldonado / Punta del Este
    ]
    let z = zones[Math.floor(Math.random()*zones.length)]
    return {
      lat: z.lat + (Math.random() * 0.01),
      lon: z.lon + (Math.random() * 0.01)
    }
  }

  // Resto del país
  const zones2 = [
    { lat: -32.320, lon: -58.075 }, // Paysandú
    { lat: -31.383, lon: -57.960 }, // Salto
    { lat: -30.910, lon: -55.550 }  // Rivera
  ]
  let z = zones2[Math.floor(Math.random()*zones2.length)]
  return {
    lat: z.lat + (Math.random() * 0.01),
    lon: z.lon + (Math.random() * 0.01)
  }
}

let handler = async (m, { conn, text }) => {
  try {
    // Check owner
    if (!owners.includes(m.sender))
      return m.reply("🚫 No tienes permiso para usar este comando.")

    let who
    if (m.isGroup) {
      if (m.mentionedJid?.length) who = m.mentionedJid[0]
      else if (m.quoted?.sender) who = m.quoted.sender
    }

    if (!who && text) {
      const num = text.replace(/[^0-9]/g, "")
      if (num) who = `${num}@s.whatsapp.net`
    }

    if (!who) who = m.sender

    // Detectar ubicación real
    let realLoc = null

    if (m.quoted && m.quoted.message?.locationMessage) {
      realLoc = {
        lat: m.quoted.message.locationMessage.degreesLatitude,
        lon: m.quoted.message.locationMessage.degreesLongitude,
        name: m.quoted.message.locationMessage.name || "Ubicación enviada"
      }
    }

    // Datos falsos hiperrealistas
    const prov = randomProvider()
    const fakeIP = randomIP(prov.ipStart)
    const fakeASN = prov.asn
    const fakeOrg = prov.org
    const fakeAddress = randomAddress()
    const fakeCoords = randomCoordinates()

    const now = new Date().toLocaleString("es-UY", { timeZone: "America/Montevideo" })

    let msg

    if (realLoc) {
      // --- MODO GEOLOCALIZACIÓN REAL ---
      msg =
`📡 *OSINT GEOLOCATION REPORT*
──────────────────────────
👤 *Objetivo:* @${who.split('@')[0]}
🕒 *Timestamp:* ${now}

📍 *Coordenadas reales detectadas:*
• Lat: ${realLoc.lat}
• Lon: ${realLoc.lon}
• Punto: ${realLoc.name}

🌐 *Red*:
• IP aproximada: ${fakeIP}
• ASN: ${fakeASN}
• Organización: ${fakeOrg}
• Reverse DNS: mob-${Math.floor(Math.random()*900+100)}.client.uy.net

🏠 *Dirección estimada (triangulación):*
${fakeAddress}

📶 *Antena LTE asignada:* Sector-${Math.floor(Math.random()*999)} (${prov.name})
──────────────────────────
⚠️ Este dox es falso. Uso humorístico.`

    } else {
      // --- MODO DOX TOTALMENTE FALSO ---
      msg =
`📡 *OSINT GEOLOCATION REPORT*
──────────────────────────
👤 *Objetivo:* @${who.split('@')[0]}
🕒 *Timestamp:* ${now}

🌐 *Red & Infraestructura*
• IP: ${fakeIP}
• ASN: ${fakeASN}
• ISP: ${prov.name}
• Organización: ${fakeOrg}
• Reverse DNS: srv-${Math.floor(Math.random()*900+100)}.backbone.uy.net

📍 *Coordenadas aproximadas:*
• Lat: ${fakeCoords.lat.toFixed(6)}
• Lon: ${fakeCoords.lon.toFixed(6)}

🏠 *Dirección asociada:*
${fakeAddress}

📶 *Antena LTE conectada:* Nodo-${Math.floor(Math.random()*500)} (${prov.name})
──────────────────────────
⚠️ Datos falsos con fines humorísticos 🔒`
    }

    await conn.sendMessage(m.chat, {
      text: msg,
      mentions: [who],
      quoted: m // <--- CITA EL MENSAJE ORIGINAL
    })

  } catch (err) {
    console.error(err)
    m.reply("⚠️ Error inesperado ejecutando el comando.")
  }
}

handler.command = ["doxear"]
handler.owner = true
handler.rowner = true
handler.tags = ["owner"]

export default handler
