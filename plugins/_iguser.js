let handler = async (m, { conn, args }) => {
  if (!args[0]) return m.reply('❗ Ingresa el nombre de usuario de Instagram.\n\nEjemplo:\n.iguser messi')

  let username = args[0]

  try {
    m.reply(`⏳ Consultando perfil de @${username}...`)

    let apiKey = 'd9dfe7fc-75d4-4eab-bd5a-b166e78da001'
    let apiUrl = `https://api.hasdata.com/scrape/instagram/profile?handle=${encodeURIComponent(username)}`

    // fetch nativo
    let res = await fetch(apiUrl, {
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json'
      }
    })

    if (!res.ok) throw new Error(`HTTP error ${res.status}`)

    let json = await res.json()

    if (!json.data) return m.reply('❌ No se pudo obtener el perfil. Puede que el usuario no exista o sea privado.')

    let info = json.data

    let msg = `
📸 *Perfil de Instagram*
──────────────────
👤 Usuario: @${info.username || username}
🪪 Nombre: ${info.full_name || "No disponible"}
👥 Seguidores: ${info.followers_count ?? "No info"}
👤 Siguiendo: ${info.following_count ?? "No info"}
📄 Biografía: ${info.biography || "Sin biografía"}
🔐 Privado: ${info.is_private ? "Sí" : "No"}
🔗 Link: https://instagram.com/${info.username || username}
    `.trim()

    await conn.sendMessage(m.chat, {
      image: { url: info.profile_pic_hd_url || info.profile_pic_url || undefined },
      caption: msg
    })

  } catch (e) {
    console.error(e)
    m.reply('❌ Error al consultar el perfil. Verifica tu API key y que el usuario exista.')
  }
}

handler.command = ['iguser', 'iginfo', 'igperfil']
export default handler
