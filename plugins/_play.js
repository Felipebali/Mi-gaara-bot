import yts from 'yt-search'
import fetch from 'node-fetch'

const COOLDOWN = 2 * 60 * 1000 // 2 minutos

// =============================
// 🔥 SISTEMA YT
// =============================

const yt = {
  static: Object.freeze({
    baseUrl: 'https://cnv.cx',
    headers: {
      'accept-encoding': 'gzip, deflate, br, zstd',
      origin: 'https://frame.y2meta-uk.com',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  }),

  resolveConverterPayload(link, f = '128k') {
    const tipo = 'mp3'
    return {
      link,
      format: tipo,
      audioBitrate: '128',
      filenameStyle: 'pretty'
    }
  },

  async getBuffer(u) {
    const r = await fetch(u)
    const ab = await r.arrayBuffer()
    return Buffer.from(ab)
  },

  async getKey() {
    const r = await fetch(this.static.baseUrl + '/v2/sanity/key', {
      headers: this.static.headers
    })
    return r.json()
  },

  async convert(u) {
    const { key } = await this.getKey()
    const p = this.resolveConverterPayload(u)
    const r = await fetch(this.static.baseUrl + '/v2/converter', {
      method: 'POST',
      headers: { key, ...this.static.headers },
      body: new URLSearchParams(p)
    })
    return r.json()
  },

  async download(u) {
    const { url, filename } = await this.convert(u)
    const buffer = await this.getBuffer(url)
    return { buffer, fileName: filename }
  }
}

// =============================
// 🎵 HANDLER
// =============================

let handler = async (m, { conn, args, isAdmin, isOwner }) => {

  if (!args.length) return m.reply('🎵 Usa: .play nombre de la canción')

  const sender = m.sender

  // =============================
  // 📂 BASE DE DATOS
  // =============================

  if (!global.db.data.users[sender])
    global.db.data.users[sender] = {}

  let user = global.db.data.users[sender]

  if (!user.playCooldown) user.playCooldown = 0
  if (!user.warn) user.warn = 0

  const now = Date.now()

  // =============================
  // 👑 OWNER SIN LIMITES
  // =============================

  if (!isOwner) {

    const lastUse = user.playCooldown || 0

    if (now - lastUse < COOLDOWN) {

      const restante = COOLDOWN - (now - lastUse)
      const seg = Math.ceil(restante / 1000)

      // ⚠️ SOLO USUARIOS NORMALES TIENEN WARN
      if (!isAdmin) {
        user.warn += 1

        return m.reply(
          `⏳ Espera ${seg}s para usar el comando.\n` +
          `⚠️ Advertencias: ${user.warn}`
        )
      }

      // 🛡 ADMIN SIN WARN
      return m.reply(`⏳ Espera ${seg}s para usar el comando.`)
    }

    // Guardar nuevo tiempo
    user.playCooldown = now
  }

  // =============================
  // 🔎 BUSCAR VIDEO
  // =============================

  try {

    await m.react('🔎')

    const query = args.join(' ')
    const search = await yts(query)

    if (!search.videos.length)
      return m.reply('❌ No se encontraron resultados')

    const video = search.videos[0]

    // Info del video
    await conn.sendMessage(
      m.chat,
      {
        text:
          `🎶 *${video.title}*\n` +
          `👤 ${video.author.name}\n` +
          `⏱ ${video.timestamp}\n` +
          `👁 ${video.views.toLocaleString()}\n\n` +
          `⏳ Descargando...`,
        contextInfo: {
          externalAdReply: {
            title: video.title,
            body: video.author.name,
            thumbnailUrl: video.thumbnail,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      },
      { quoted: m }
    )

    // Descargar audio
    const { buffer, fileName } = await yt.download(video.url)

    await conn.sendMessage(
      m.chat,
      {
        audio: buffer,
        mimetype: 'audio/mpeg',
        fileName
      },
      { quoted: m }
    )

    await m.react('✅')

  } catch (e) {
    console.error(e)
    m.reply('❌ Error al reproducir la canción')
  }
}

handler.help = ['play <texto>']
handler.tags = ['music']
handler.command = ['play', 'mp3']

export default handler
