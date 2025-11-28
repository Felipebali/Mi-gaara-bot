import fetch from 'node-fetch'

let handler = async (m, { conn, args }) => {
  if (!args[0]) return m.reply('❗ Ingresa el nombre de usuario de Instagram.\n\nEjemplo:\n.iguser messi')

  let username = args[0]

  try {
    m.reply(`⏳ Consultando perfil de *${username}*...`)

    // URL pública de Instagram con JSON incrustado
    let url = `https://www.instagram.com/${username}/?__a=1&__d=dis`

    let res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    })

    if (!res.ok) throw new Error('Usuario no encontrado o perfil privado.')

    let json = await res.json()

    // Acceder al objeto del perfil
    let user = json.graphql.user

    let msg = `
📸 *Perfil de Instagram*
──────────────────
👤 Usuario: @${user.username}
🪪 Nombre: ${user.full_name || "No disponible"}
👥 Seguidores: ${user.edge_followed_by.count}
👤 Siguiendo: ${user.edge_follow.count}
🔗 Link: https://instagram.com/${user.username}
📄 Biografía: ${user.biography || "Sin biografía"}
🔐 Privado: ${user.is_private ? "Sí" : "No"}
    `.trim()

    await conn.sendMessage(m.chat, {
      image: { url: user.profile_pic_url_hd },
      caption: msg
    })

  } catch (e) {
    console.error(e)
    m.reply('❌ Error al consultar el perfil. Es posible que el usuario no exista o sea privado.')
  }
}

handler.command = ['iguser', 'iginfo', 'igperfil']
export default handler
