// ══════════════════════════════════════════════════════
      // 📱 ANTICANAL
      // ══════════════════════════════════════════════════════
      if (chat.anticanal) {
        const isForwarded = m.message?.extendedTextMessage?.contextInfo?.isForwarded
        const isFromNewsletter = m.message?.extendedTextMessage?.contextInfo?.forwardedNewsletterMessageInfo

        if (isForwarded && isFromNewsletter) {
          console.log(`📱 Contenido de canal detectado de: ${senderJid}`)

          await conn.sendText(remoteJid, `📱 @${num} compartió contenido de canal. Serás eliminado...`, null, { mentions: [mention] })

          try {
            await conn.sendMessage(remoteJid, {
              delete: { remoteJid, fromMe: false, id: m.key.id, participant: m.key.participant }
            })
          } catch (err) {
            console.error(`⚠️ Error eliminando: ${err.message}`)
          }

          try {
            const metadata = await conn.groupMetadata(remoteJid)
            const groupParticipants = metadata.participants || []
            let realJid = senderJid
            const senderNum = cleanNum(senderJid)

            for (const p of groupParticipants) {
              const pNum = cleanNum(p.id)
              if (senderNum === pNum) {
                realJid = p.id
                break
              }
            }

            await conn.groupParticipantsUpdate(remoteJid, [realJid], "remove")
            console.log(`✅ ${num} eliminado (anticanal)`)
          } catch (err) {
            console.error(`⚠️ Error expulsando: ${err.message}`)
          }

          return true
        }
      }

    } catch (err) {
      console.error(`❌ Error en protecciones-before:`, err.message)
    }
  }
}
