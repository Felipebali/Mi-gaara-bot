import translate from '@vitalets/google-translate-api'
import axios from 'axios'
import fetch from 'node-fetch'

const handler = async (m, { conn, text, command, usedPrefix }) => {
  // ================= SEGURIDAD =================
  if (!text) {
    throw `🤖 Escribí algo para hablar conmigo.\nEjemplo:\n${usedPrefix + command} Hola bot`
  }

  try {
    const resSimi = await simitalk(text, 'es')
    await conn.sendMessage(
      m.chat,
      { text: resSimi.resultado.simsimi },
      { quoted: m }
    )
  } catch (e) {
    throw '❌ No pude responder en este momento. Intentá más tarde.'
  }
}

// ================= CONFIG =================
handler.help = ['simi', 'bot', 'alexa', 'cortana']
handler.tags = ['fun']
handler.command = /^((sim)?simi|bot|alexa|cortana)$/i

export default handler

// ================= SIMI CORE =================
async function simitalk(ask, language = 'es', apikeyyy = 'iJ6FxuA9vxlvz5cKQCt3') {
  if (!ask) {
    return {
      status: false,
      resultado: { msg: 'Debes ingresar un texto.' }
    }
  }

  // ===== OPCIÓN 1 =====
  try {
    const response11 = await chatsimsimi(ask, language)
    if (!response11?.message) throw new Error('Respuesta inválida')
    return {
      status: true,
      resultado: { simsimi: response11.message }
    }
  } catch {}

  // ===== OPCIÓN 2 =====
  try {
    const response1 = await axios.get(
      `https://delirius-apiofc.vercel.app/tools/simi?text=${encodeURIComponent(ask)}`
    )
    if (!response1?.data?.data?.message) throw new Error('API vacía')

    const trad1 = await translate(response1.data.data.message, {
      to: language,
      autoCorrect: true
    })

    return {
      status: true,
      resultado: { simsimi: trad1.text }
    }
  } catch {}

  // ===== OPCIÓN 3 =====
  try {
    const response2 = await axios.get(
      `https://api.anbusec.xyz/api/v1/simitalk?apikey=${apikeyyy}&ask=${encodeURIComponent(
        ask
      )}&lc=${language}`
    )

    if (!response2?.data?.message) throw new Error('Sin mensaje')

    return {
      status: true,
      resultado: { simsimi: response2.data.message }
    }
  } catch (error) {
    return {
      status: false,
      resultado: {
        msg: 'Todas las APIs fallaron.',
        error: error.message
      }
    }
  }
}

// ================= API SIMI =================
async function chatsimsimi(ask, language) {
  try {
    const response = await axios.post(
      'https://simi.anbuinfosec.live/api/chat',
      { ask, lc: language },
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome Mobile',
          'Content-Type': 'application/json',
          Referer: 'https://simi.anbuinfosec.live/'
        }
      }
    )
    return response.data
  } catch {
    return { success: false }
  }
}
