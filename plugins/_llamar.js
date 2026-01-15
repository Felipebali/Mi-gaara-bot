// 📂 plugins/grupos-llamar.js — FelixCat_Bot 🐾
// .llamar @usuario → envía avisos repetidos
// .cancelar → detiene el proceso

// Control de llamadas activas por chat
let activeCalls = {}

let handler = async (m, { conn, command, args }) => {
  const chatId = m.chat

  // 🔐 SOLO OWNERS reales del bot
  if (!m.isOwner)
    return m.reply('🚫 Solo los dueños del bot pueden usar este comando.')

  // ===============================
  // COMANDO LLAMAR
  // ===============================
  if (command === 'llamar') {
    if (!m.isGroup)
      return m.reply('❌ Este comando solo funciona en grupos.')

    const target = m.mentionedJid?.[0]
    if (!target)
      return m.reply('⚠️ Debes mencionar a alguien.\nEjemplo: *.llamar @usuario*')

    // Evitar llamadas simultáneas
    if (activeCalls[chatId]?.running)
      return m.reply('⚠️ Ya hay una llamada en curso.\nUsa *.cancelar* para detenerla.')

    const total = Math.min(parseInt(args[1]) || 10, 50)
    const intervalo = Math.max(1, Math.min(parseInt(args[2]) || 5, 60))

    activeCalls[chatId] = {
      running: true,
      target
    }

    await conn.sendMessage(m.chat, {
      text:
        `📞 *Llamada iniciada*\n` +
        `👤 Usuario: @${target.split('@')[0]}\n` +
        `🔢 Repeticiones: *${total}*\n` +
        `⏳ Intervalo: *${intervalo}s*\n\n` +
        `🛑 Usa *.cancelar* para detener inmediatamente.`,
      mentions: [target]
    }, { quoted: m })

    // ===============================
    // LOOP DE AVISOS
    // ===============================
    for (let i = 0; i < total; i++) {
      if (!activeCalls[chatId]?.running) {
        delete activeCalls[chatId]
        return m.reply('🛑 *Llamada cancelada.*')
      }

      try {
        await conn.sendMessage(chatId, {
          text: `📞 *LLAMADA #${i + 1}*\n➡️ @${target.split('@')[0]}`,
          mentions: [target]
        })
      } catch (e) {
        console.error('Error enviando llamada:', e)
      }

      await new Promise(r => setTimeout(r, intervalo * 1000))
    }

    delete activeCalls[chatId]
    return m.reply('✅ *Llamadas finalizadas.*')
  }

  // ===============================
  // COMANDO CANCELAR
  // ===============================
  if (command === 'cancelar') {
    if (!activeCalls[chatId]?.running)
      return m.reply('⚠️ No hay ninguna llamada activa en este grupo.')

    activeCalls[chatId].running = false
    return m.reply('🛑 *Llamada cancelada.*')
  }
}

handler.command = ['llamar', 'cancelar']
handler.tags = ['owner']
handler.help = ['llamar @usuario (veces) (intervalo)', 'cancelar']
handler.owner = true

export default handler
