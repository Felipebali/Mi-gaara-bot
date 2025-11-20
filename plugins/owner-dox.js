// 📂 plugins/_dox_joda_realista.js — Doxeo joda estilo realista (100% ficticio, solo owners)

const owners = [
  '59898719147@s.whatsapp.net',
  '59896026646@s.whatsapp.net',
  '59892363485@s.whatsapp.net'
]

let handler = async (m, { conn, text }) => {
  try {
    const sender = m.sender
    if (!owners.includes(sender)) {
      return m.reply(`🚫 @${sender.split('@')[0]} — No tienes permiso para usar este comando.`, null, { mentions: [m.sender] })
    }

    // --- Determinar objetivo ---
    let who
    if (m.mentionedJid?.length) who = m.mentionedJid[0]
    else if (m.quoted?.sender) who = m.quoted.sender
    else if (text) {
      const num = text.replace(/[^0-9]/g, '')
      if (num) who = `${num}@s.whatsapp.net`
    }
    if (!who) who = m.sender

    const objetivo = '@' + who.split('@')[0]

    // --- Datos completamente inventados ---
    const fakeIP = `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`
    const fakeHost = `node-${Math.floor(Math.random()*9999)}.edge-net.fakehost.net`
    const fakeApiKey = `api_${Math.random().toString(36).substring(2, 16)}${Math.random().toString(36).substring(2, 8)}`
    const fakeLocation = [
      "DataCenter Secundario - Sector 4B",
      "Nodo Satelital 11 - Banda Ka",
      "Cluster Proxy Sombra - Módulo 3",
      "Red Interna 7G - Punto de Control",
      "Servidor Local - Zona Desconocida"
    ].sort(() => Math.random() - 0.5)[0]

    const fakeAddress = `${Math.floor(Math.random()*999)} Calle Inexistente, Sector ${Math.floor(Math.random()*40)+1}`
    const fakeOS = ["AstraOS 12.4", "NebulaCore v3", "HyperLinux 9 Mod", "SpecterOS 5.2"][Math.floor(Math.random()*4)]
    const fakeISP = ["QuantumFiber LTD", "SkyLink ShadowNet", "Nebula Communications", "Proxima Datastream"][Math.floor(Math.random()*4)]

    // --- Mensaje final ---
    const informe =
`🛰️ **INFORME DE RASTREO — ACCESO AUTORIZADO**
Objetivo: ${objetivo}

━━━━━━━━━━━━━━━━━━
📍 **Dirección Registrada**
${fakeAddress}

🌐 **IP Detectada**
${fakeIP}

🏢 **ISP / Proveedor**
${fakeISP}

🖥️ **Sistema Operativo**
${fakeOS}

🔌 **Host Principal**
${fakeHost}

🔑 **API Key Filtrada**
${fakeApiKey}

📡 **Ubicación Técnica**
${fakeLocation}

━━━━━━━━━━━━━━━━━━
⚠️ *Informe generado automáticamente. Datos no verificables.*
━━━━━━━━━━━━━━━━━━`

    await conn.sendMessage(m.chat, {
      text: informe,
      mentions: [who]
    })

  } catch (e) {
    console.error(e)
    m.reply('⚠️ Error al generar el dox.')
  }
}

// Loader compatible
handler.command = ['dox', 'doxjoda', 'doxear']
handler.help = ['dox @usuario']
handler.tags = ['owner']

handler.owner = true
handler.rowner = true

export default handler
