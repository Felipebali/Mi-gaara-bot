import fetch from 'node-fetch'

let handler = async (m, { conn, args }) => {
  if (!args[0])
    return m.reply('❗ Ingresa el nombre de usuario de Instagram.\n\nEjemplo:\n.iguser messi')

  let user = args[0]

  try {
    m.reply(`⏳ Consultando perfil de *${user}*...`)

    let api = `https://api.ryzendesu.vip/api/instagram/userinfo?username=${encodeURIComponent(user)}`
    let res = await fetch(api)
    let json = await res.json()

    if (!json.status || !json.result)
      return m.reply('❌ No pude obtener el perfil.')

    let info = json.result

    let msg = `
📸 *Perfil de Instagram*
──────────────────
👤 Usuario: @${info.username}
🪪 Nombre: ${info.full_name || "No disponible"}
👥 Seguidores: ${info.follower_count}
👤 Siguiendo: ${info.following_count}
🔐 Privado: ${info.is_private ? "Sí" : "No"}
🔗 Link: https://instagram.com/${info.username}
📄 Biografía: ${info.biography || "Sin biografía"}
    `.trim()

    await conn.sendMessage(m.chat, {
      image: { url: info.profile_pic_url_hd },
      caption: msg
    })

  } catch (e) {
    console.error(e)
    m.reply('❌ Error al consultar el perfil.')
  }
}

handler.command = ['iguser', 'iginfo', 'igperfil']
export default handler
