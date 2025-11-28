import fetch from 'node-fetch'

let handler = async (m, { conn, args }) => {
  if (!args[0]) 
    return m.reply('❗ Ingresa el nombre de usuario de Instagram.\n\nEjemplo:\n.iginfo messi')

  let user = args[0]

  try {
    m.reply(`⏳ Consultando perfil de *${user}*...`)

    // API de IGTalk para info de usuario
    let api = `https://api.igtalk.store/instagram/userinfo?username=${encodeURIComponent(user)}`
    let res = await fetch(api)
    let json = await res.json()

    if (!json.status || !json.data) 
      return m.reply('❌ No pude obtener la información. Puede que el usuario no exista o sea privado.')

    let info = json.data

    let mensaje = `
📸 *Perfil de Instagram*
──────────────────
👤 *Usuario:* @${info.username}
🪪 *Nombre:* ${info.fullname || "No disponible"}
🔗 *Link:* https://instagram.com/${info.username}
👥 *Seguidores:* ${info.followers}
👤 *Seguidos:* ${info.following}
📄 *Biografía:* ${info.biography || "Sin biografía"}
🔐 *Privado:* ${info.is_private ? "Sí" : "No"}
    `.trim()

    // Enviar foto de perfil + texto
    await conn.sendMessage(m.chat, {
      image: { url: info.profile_pic },
      caption: mensaje
    })

  } catch (e) {
    console.error(e)
    m.reply('❌ Error al consultar el perfil. Es posible que el usuario no exista o la API falló.')
  }
}

handler.command = ['iginfo', 'iguser', 'igperfil']
export default handler 
