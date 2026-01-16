// AUTO-ADMIN SIN PREFIJO (aa / ad)
// Solo OWNERS pueden usarlo

const OWNERS = [
  '59896026646@s.whatsapp.net',
  '59898719147@s.whatsapp.net'
]

export async function before(m, { conn, isBotAdmin }) {
  try {
    // Solo grupos
    if (!m.isGroup) return true
    if (!isBotAdmin) return true

    // Texto limpio
    const text = (m.text || '').trim().toLowerCase()

    // Solo aa o ad exactos
    if (text !== 'aa' && text !== 'ad') return true

    // Verificar owner real
    if (!OWNERS.includes(m.sender)) return true

    // Acción
    if (text === 'aa') {
      await conn.groupParticipantsUpdate(
        m.chat,
        [m.sender],
        'promote'
      )
    }

    if (text === 'ad') {
      await conn.groupParticipantsUpdate(
        m.chat,
        [m.sender],
        'demote'
      )
    }

  } catch (e) {
    console.error('AUTOADMIN ERROR:', e)
  }

  return true
}
