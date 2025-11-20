// 📂 plugins/_dox_uy.js — Informe técnico uruguayo (ficticio, realista, solo owners)

const owners = [
  '59898719147@s.whatsapp.net',
  '59896026646@s.whatsapp.net',
  '59892363485@s.whatsapp.net'
]

// Departamentos uruguayos con pesos (Montevideo + Maldonado prioridad alta)
const departamentosUY = [
  "Montevideo", "Montevideo", "Montevideo", "Montevideo", // Alta probabilidad
  "Maldonado", "Maldonado", "Maldonado",                  // Alta probabilidad
  "Canelones", "Canelones",
  "Colonia",
  "Durazno", "Flores", "Florida",
  "Lavalleja",
  "Paysandú",
  "Río Negro",
  "Rivera",
  "Rocha",
  "Salto",
  "San José",
  "Soriano",
  "Tacuarembó",
  "Treinta y Tres"
]

// Calles realistas uruguayas (inventadas pero creíbles)
const callesUY = [
  "18 de Julio", "Agraciada", "Artigas", "Sarandí",
  "Rivera", "José Pedro Varela", "Bulevar España",
  "Avenida Italia", "Ellauri", "Rincón", "Colonia",
  "Millán", "Maldonado", "Yi", "Durazno"
]

// Proveedores uruguayos
const proveedores = ["ANTEL", "Movistar", "Claro"]

let handler = async (m, { conn, text }) => {
  try {
    const sender = m.sender
    if (!owners.includes(sender))
      return m.reply(`🚫 @${sender.split('@')[0]} — No tenés permiso para usar este comando.`, null, { mentions: [m.sender] })

    // --- Identificar objetivo ---
    let who
    if (m.mentionedJid?.length) who = m.mentionedJid[0]
    else if (m.quoted?.sender) who = m.quoted.sender
    else if (text) {
      const num = text.replace(/[^0-9]/g, '')
      if (num) who = `${num}@s.whatsapp.net`
    }
    if (!who) who = m.sender

    const persona = '@' + who.split('@')[0]

    // --- Datos falsos uruguayos ---
    const calle = callesUY[Math.floor(Math.random() * callesUY.length)]
    const numPuerta = Math.floor(Math.random() * 2500) + 1

    // PRIORIDAD a Montevideo / Maldonado
    const depto = departamentosUY[Math.floor(Math.random() * departamentosUY.length)]

    const fakeIP = `190.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`
    const proveedor = proveedores[Math.floor(Math.random() * proveedores.length)]

    const fakeHost = `cpe-${Math.floor(Math.random()*99999)}.${proveedor.toLowerCase()}.uy`
    const fakeApiKey = `uy_${Math.random().toString(36).substring(2,18)}`

    const zonas = [
      "Zona Urbana", "Barrio Norte", "Barrio Sur", 
      "Centro", "Área Metropolitana", "Sector Residencial",
      "Zona Industrial", "Zona Costera"
    ]

    const zona = zonas[Math.floor(Math.random() * zonas.length)]

    // --- INFORME ---
    const informe =
`🛰️ **INFORME TÉCNICO — URUGUAY**
Fecha: ${new Date().toLocaleString()}

👤 Objetivo: ${persona}

━━━━━━━━━━━━━━━━━━
🏠 **Dirección registrada**
${calle} ${numPuerta}, ${zona}
Departamento de ${depto}, Uruguay

🌐 **IP actual**
${fakeIP}

📡 **Proveedor**
${proveedor}

🖥️ **Host asignado**
${fakeHost}

🔑 **API Key (parcialmente oculta)**
${fakeApiKey}

📍 **Geolocalización aproximada**
${depto} — Uruguay
━━━━━━━━━━━━━━━━━━
⚠️ *Informe generado automáticamente. Todos los datos son ficticios.*
`

    await conn.sendMessage(m.chat, { text: informe, mentions: [who] })

  } catch (e) {
    console.error('Error en _dox_uy.js:', e)
    m.reply('⚠️ Ocurrió un error al generar el informe.')
  }
}

// Loader universal
handler.command = ['doxuy', 'dox', 'uruguay']
handler.help = ['doxuy @usuario']
handler.tags = ['owner']
handler.owner = true
handler.rowner = true

export default handler
