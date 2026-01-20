import fetch from 'node-fetch'
import yts from 'yt-search'
import ytdl from 'ytdl-core'

const LimitAud = 725 * 1024 * 1024
const LimitVid = 425 * 1024 * 1024

let tempStorage = {}

// ================= PLAY =================
const handler = async (m, { conn, command, text, usedPrefix }) => {
  if (!text)
    return conn.reply(
      m.chat,
      `${lenguajeGB['smsAvisoMG']()}${mid.smsMalused4}\n*${usedPrefix + command} Billie Eilish - Bellyache*`,
      m
    )

  const yt = await yts.search({ query: text, hl: 'es', gl: 'ES' })
  const video = yt.videos?.[0]

  if (!video)
    return conn.reply(m.chat, '❌ No se encontraron resultados', m)

  const info = `⌘━─━─≪ *YOUTUBE* ≫─━─━⌘
★ ${mid.smsYT1}
★ ${video.title}
★ ${mid.smsYT15}
★ ${video.ago}
★ ${mid.smsYT5}
★ ${secondString(video.duration.seconds)}
★ ${mid.smsYT10}
★ ${MilesNumber(video.views)}
★ ${mid.smsYT2}
★ ${video.author.name}
★ ${mid.smsYT4}
★ ${video.url.replace(/^https?:\/\//, '')}
⌘━━─≪ ${gt} ≫─━━⌘`

  tempStorage[m.sender] = {
    url: video.url,
    title: video.title
  }

  await conn.sendMessage(
    m.chat,
    {
      image: { url: video.thumbnail },
      caption: info + `\n\n🎶 Audio | 📽 Video`
    },
    { quoted: m }
  )
}

// ================= RESPUESTA 🎶 / 📽 =================
handler.before = async (m, { conn }) => {
  const text = m.text?.trim()
  if (!['🎶', 'audio', '📽', 'video'].includes(text)) return

  const data = tempStorage[m.sender]
  if (!data) return

  try {
    // ===== AUDIO =====
    if (text === '🎶' || text === 'audio') {
      await conn.reply(m.chat, lenguajeGB['smsAvisoEG']() + mid.smsAud, fkontak)

      const audioUrl = await downloadAudio(data.url)
      if (!audioUrl) throw 'No se pudo descargar el audio'

      const size = await getFileSize(audioUrl)
      const sendAsDoc = size > LimitAud

      await conn.sendMessage(
        m.chat,
        sendAsDoc
          ? {
              document: { url: audioUrl },
              mimetype: 'audio/mpeg',
              fileName: `${data.title}.mp3`
            }
          : {
              audio: { url: audioUrl },
              mimetype: 'audio/mpeg'
            },
        { quoted: m }
      )
    }

    // ===== VIDEO =====
    if (text === '📽' || text === 'video') {
      await conn.reply(m.chat, lenguajeGB['smsAvisoEG']() + mid.smsVid, fkontak)

      const videoUrl = await downloadVideo(data.url)
      if (!videoUrl) throw 'No se pudo descargar el video'

      const size = await getFileSize(videoUrl)
      const sendAsDoc = size > LimitVid

      await conn.sendMessage(
        m.chat,
        sendAsDoc
          ? {
              document: { url: videoUrl },
              mimetype: 'video/mp4',
              fileName: `${data.title}.mp4`,
              caption: `⟡ *${data.title}*\n> ${wm}`
            }
          : {
              video: { url: videoUrl },
              mimetype: 'video/mp4',
              caption: `⟡ *${data.title}*\n> ${wm}`
            },
        { quoted: m }
      )
    }
  } catch (e) {
    console.error(e)
    await conn.reply(m.chat, '❌ Error al procesar la descarga', m)
  } finally {
    delete tempStorage[m.sender]
  }
}

handler.command = /^(play|play2)$/i
handler.register = true
export default handler

// ================= DESCARGAS =================
async function downloadAudio(url) {
  const apis = [
    `https://api.neoxr.eu/api/youtube?type=audio&quality=128kbps&url=${url}&apikey=GataDios`,
    `https://api.zenkey.my.id/api/download/ytmp3?apikey=zenkey&url=${url}`,
    `https://api.dorratz.com/v2/yt-mp3?url=${url}`
  ]

  for (const api of apis) {
    try {
      const res = await fetch(api).then(r => r.json())
      const link =
        res?.data?.url ||
        res?.result?.download?.url ||
        res?.download ||
        res?.url

      if (link) return link
    } catch {}
  }

  // 🛟 fallback ytdl
  try {
    const info = await ytdl.getInfo(url)
    const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly' })
    return format.url
  } catch {
    return null
  }
}

async function downloadVideo(url) {
  const apis = [
    `https://api.neoxr.eu/api/youtube?type=video&quality=720p&url=${url}&apikey=GataDios`,
    `https://api.siputzx.my.id/api/d/ytmp4?url=${url}`,
    `https://exonity.tech/api/ytdlp2-faster?apikey=adminsepuh&url=${url}`
  ]

  for (const api of apis) {
    try {
      const res = await fetch(api).then(r => r.json())
      const link =
        res?.data?.url ||
        res?.result?.media?.mp4 ||
        res?.dl

      if (link) return link
    } catch {}
  }

  return null
}

// ================= UTILS =================
async function getFileSize(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return Number(res.headers.get('content-length') || 0)
  } catch {
    return 0
  }
}

function MilesNumber(n) {
  return n.toLocaleString('es-ES')
}

function secondString(seconds) {
  seconds = Number(seconds)
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}{ mimetype: 'audio/mp4' })
} catch (e) {
try {
let d2 = await fetch(`https://exonity.tech/api/ytdlp?apikey=adminsepuh&url=${yt_play[0].url}`)
let dp = await d2.json()
const audioUrl = dp.result.audio
await conn.sendMessage(m.chat, { audio: { url: audioUrl }, mimetype: 'audio/mpeg' }, { quoted: m }) 
} catch (e) { 
try {
let d3 = await fetch(`https://api.dorratz.com/v2/yt-mp3?url=${yt_play[0].url}`)
await conn.sendMessage(m.chat, { audio: d3, mimetype: 'audio/mp4' }, { quoted: m })   
} catch (e) { 
await m.react('❌')
console.log(e)
}}}}}}}

if (command == 'video') {
try {    
let searchh = await yts(yt_play[0].url)
let __res = searchh.all.map(v => v).filter(v => v.type == "video")
let infoo = await ytdl.getInfo('https://youtu.be/' + __res[0].videoId)
let ress = await ytdl.chooseFormat(infoo.formats, { filter: 'audioonly' })
await conn.sendMessage(m.chat, { video: { url: await ress.url }, fileName: `${yt_play[0].title}.mp4`, mimetype: 'video/mp4', caption: `⟡ *${yt_play[0].title}*\n> ${wm}`}, { quoted: m })
} catch (e1) {
try {    
const res = await fetch(`https://api.zenkey.my.id/api/download/ytmp3?apikey=zenkey&url=${yt_play[0].url}`)
let { result } = await res.json()
await conn.sendMessage(m.chat, { video: { url: await result.download.url }, fileName: `${yt_play[0].title}.mp4`, mimetype: 'video/mp4', caption: `⟡ *${yt_play[0].title}*\n> ${wm}`}, { quoted: m })
} catch (e1) {
try {    
const apiUrl = `https://deliriussapi-oficial.vercel.app/download/ytmp4?url=${encodeURIComponent(yt_play[0].url)}`;
const apiResponse = await fetch(apiUrl);
const delius = await apiResponse.json();
if (!delius.status) {
return m.react("❌")}
const downloadUrl = delius.data.download.url;
await conn.sendMessage(m.chat, { video: { url: downloadUrl }, fileName: `${yt_play[0].title}.mp4`, mimetype: 'video/mp4', caption: `⟡ *${yt_play[0].title}*\n> ${wm}`}, { quoted: m })
} catch (e1) {
try {    
const yt = await youtubedl(yt_play[0].url).catch(async _ => await youtubedlv2(yt_play[0].url))
console.log(yt)
let q = getBestVideoQuality(yt)
console.log(q)
await conn.sendMessage(m.chat, { video: { url: await yt.video[q].download() }, fileName: `${await yt.title}.mp4`, mimetype: 'video/mp4', caption: `⟡ *${yt_play[0].title}*\n⟡ \`${q}\` | ${await yt.video[q].fileSizeH}\n> ${wm}`}, { quoted: m })
} catch (e) {
await m.react('❌')
console.log(e)
}}}}}

if (command == 'play3' || command == 'playdoc') {
try {    
let searchh = await yts(yt_play[0].url)
let __res = searchh.all.map(v => v).filter(v => v.type == "video")
let infoo = await ytdl.getInfo('https://youtu.be/' + __res[0].videoId)
let ress = await ytdl.chooseFormat(infoo.formats, { filter: 'audioonly' })
await conn.sendMessage(m.chat, { document: { url: ress.url }, mimetype: 'audio/mpeg', fileName: `${yt_play[0].title}.mp3` }, { quoted: m });
} catch (e1) {
try {    
const res = await fetch(`https://api.zenkey.my.id/api/download/ytmp3?apikey=zenkey&url=${yt_play[0].url}`)
let { result } = await res.json()
await conn.sendMessage(m.chat, { document: { url: result.download.url }, mimetype: 'audio/mpeg', fileName: `${yt_play[0].title}.mp3` }, { quoted: m });
} catch (e1) {
try {    
const apiUrl = `${apis}/download/ytmp4?url=${encodeURIComponent(yt_play[0].url)}`;
const apiResponse = await fetch(apiUrl);
const delius = await apiResponse.json();
if (!delius.status) {
return m.react("❌")}
const downloadUrl = delius.data.download.url;
await conn.sendMessage(m.chat, { document: { url: downloadUrl }, mimetype: 'audio/mpeg', fileName: `${yt_play[0].title}.mp3` }, { quoted: m });
} catch (e1) {
try {    
let q = '128kbps'
const yt = await youtubedl(yt_play[0].url).catch(async _ => await youtubedlv2(yt_play[0].url))
const dl_url = await yt.audio[q].download()
const ttl = await yt.title
const size = await yt.audio[q].fileSizeH
await conn.sendMessage(m.chat, { document: { url: dl_url }, mimetype: 'audio/mpeg', fileName: `${ttl}.mp3` }, { quoted: m });
} catch (e2) {
try {   
const downloadUrl = await fetch9Convert(yt_play[0].url); 
await conn.sendMessage(m.chat, { document: { url: downloadUrl }, mimetype: 'audio/mpeg', fileName: `${yt_play[0].title}.mp3` }, { quoted: m });
} catch (e3) {
try {
const downloadUrl = await fetchY2mate(yt_play[0].url);
await conn.sendMessage(m.chat, { document: { url: downloadUrl }, mimetype: 'audio/mpeg', fileName: `${yt_play[0].title}.mp3` }, { quoted: m });
} catch (e4) {
try {
const res = await fetch(`https://api.zenkey.my.id/api/download/ytmp3?apikey=zenkey&url=${yt_play[0].url}`)
const audioData = await res.json()
if (audioData.status && audioData.result?.downloadUrl) {
await conn.sendMessage(m.chat, { document: { url: audioData.result.downloadUrl }, mimetype: 'audio/mpeg', fileName: `${yt_play[0].title}.mp3` }, { quoted: m });
}} catch (e5) {
try {
let d2 = await fetch(`https://exonity.tech/api/ytdlp2-faster?apikey=adminsepuh&url=${yt_play[0].url}`);
let dp = await d2.json();
const audiop = await getBuffer(dp.result.media.mp3);
const fileSize = await getFileSize(dp.result.media.mp3);
await conn.sendMessage(m.chat, { document: { url: audioData.result.downloadUrl }, mimetype: 'audio/mpeg', fileName: `${yt_play[0].title}.mp3` }, { quoted: m });
} catch (e) {    
await m.react('❌');
console.log(e);
}}}}}}}}}

if (command == 'play4' || command == 'playdoc2') {
try {
let searchh = await yts(yt_play[0].url)
let __res = searchh.all.map(v => v).filter(v => v.type == "video")
let infoo = await ytdl.getInfo('https://youtu.be/' + __res[0].videoId)
let ress = await ytdl.chooseFormat(infoo.formats, { filter: 'audioonly' })
await conn.sendMessage(m.chat, { document: { url: ress.url }, fileName: `${yt_play[0].title}.mp4`, caption: `╭━❰  ${wm}  ❱━⬣\n┃ 💜 ${mid.smsYT1}\n┃ ${yt_play[0].title}\n╰━━━━━❰ *𓃠 ${vs}* ❱━━━━⬣`, thumbnail: yt_play[0].thumbnail, mimetype: 'video/mp4' }, { quoted: m })     
} catch (e1) {
try {    
const res = await fetch(`https://api.zenkey.my.id/api/download/ytmp3?apikey=zenkey&url=${yt_play[0].url}`)
let { result } = await res.json()
await conn.sendMessage(m.chat, { document: { url: result.download.url }, fileName: `${yt_play[0].title}.mp4`, caption: `╭━❰  ${wm}  ❱━⬣\n┃ 💜 ${mid.smsYT1}\n┃ ${yt_play[0].title}\n╰━━━━━❰ *𓃠 ${vs}* ❱━━━━⬣`, thumbnail: yt_play[0].thumbnail, mimetype: 'video/mp4' }, { quoted: m })     
} catch (e1) {
try {    
const apiUrl = `${apis}/download/ytmp4?url=${encodeURIComponent(yt_play[0].url)}`;
const apiResponse = await fetch(apiUrl);
const delius = await apiResponse.json();
if (!delius.status) return m.react("❌");
const downloadUrl = delius.data.download.url;
//const fileSize = await getFileSize(downloadUrl);
await conn.sendMessage(m.chat, { document: { url: downloadUrl }, fileName: `${yt_play[0].title}.mp4`, caption: `╭━❰  ${wm}  ❱━⬣\n┃ 💜 ${mid.smsYT1}\n┃ ${yt_play[0].title}\n╰━━━━━❰ *𓃠 ${vs}* ❱━━━━⬣`, thumbnail: yt_play[0].thumbnail, mimetype: 'video/mp4' }, { quoted: m })     
} catch (e1) {
try {
let d2 = await fetch(`https://exonity.tech/api/ytdlp2-faster?apikey=adminsepuh&url=${yt_play[0].url}`);
let dp = await d2.json();
const audiop = await getBuffer(dp.result.media.mp4);
await conn.sendMessage(m.chat, { document: { url: audiop }, fileName: `${yt_play[0].title}.mp4`, caption: null, thumbnail: yt_play[0].thumbnail, mimetype: 'video/mp4' }, { quoted: m })     
} catch (e2) {    
await m.react('❌');
console.log(e2);
}}}}}
}
handler.command = /^(play[2-4]?|audio|video|playdoc2?)$/i
//handler.limit = 2
handler.register = true 
export default handler

async function search(query, options = {}) {
const search = await yts.search({query, hl: 'es', gl: 'ES', ...options});
return search.videos;
}

function MilesNumber(number) {
const exp = /(\d)(?=(\d{3})+(?!\d))/g;
const rep = '$1.';
const arr = number.toString().split('.');
arr[0] = arr[0].replace(exp, rep);
return arr[1] ? arr.join('.') : arr[0];
}

function secondString(seconds) {
seconds = Number(seconds);
const d = Math.floor(seconds / (3600 * 24));
const h = Math.floor((seconds % (3600 * 24)) / 3600);
const m = Math.floor((seconds % 3600) / 60);
const s = Math.floor(seconds % 60);
const dDisplay = d > 0 ? d + (d == 1 ? ' día, ' : ' días, ') : '';
const hDisplay = h > 0 ? h + (h == 1 ? ' hora, ' : ' horas, ') : '';
const mDisplay = m > 0 ? m + (m == 1 ? ' minuto, ' : ' minutos, ') : '';
const sDisplay = s > 0 ? s + (s == 1 ? ' segundo' : ' segundos') : '';
return dDisplay + hDisplay + mDisplay + sDisplay;
}
  
const getBuffer = async (url) => {
try {
const response = await fetch(url);
const buffer = await response.arrayBuffer();
return Buffer.from(buffer);
} catch (error) {
console.error("Error al obtener el buffer", error);
throw new Error("Error al obtener el buffer");
}}

async function getFileSize(url) {
try {
const response = await fetch(url, { method: 'HEAD' })
const contentLength = response.headers.get('content-length')
return contentLength ? parseInt(contentLength, 10) : 0
} catch (error) {
console.error("Error al obtener el tamaño del archivo", error)
return 0
}}

async function fetchInvidious(url) {
const apiUrl = `https://invidious.io/api/v1/get_video_info`
const response = await fetch(`${apiUrl}?url=${encodeURIComponent(url)}`)
const data = await response.json()
if (data && data.video) {
const videoInfo = data.video
return videoInfo
} else {
throw new Error("No se pudo obtener información del video desde Invidious")
}}

function getBestVideoQuality(videoData) {
const preferredQualities = ['720p', '360p', 'auto']
const availableQualities = Object.keys(videoData.video)
for (let quality of preferredQualities) {
if (availableQualities.includes(quality)) {
return videoData.video[quality].quality
}}
return '360p'
}

async function ytMp3(url) {
return new Promise((resolve, reject) => {
ytdl.getInfo(url).then(async(getUrl) => {
let result = [];
for(let i = 0; i < getUrl.formats.length; i++) {
let item = getUrl.formats[i];
if (item.mimeType == 'audio/webm; codecs=\"opus\"') {
let { contentLength } = item;
let bytes = await bytesToSize(contentLength);
result[i] = { audio: item.url, size: bytes }}};
let resultFix = result.filter(x => x.audio != undefined && x.size != undefined) 
let tiny = await axios.get(`https://tinyurl.com/api-create.php?url=${resultFix[0].audio}`);
let tinyUrl = tiny.data;
let title = getUrl.videoDetails.title;
let thumb = getUrl.player_response.microformat.playerMicroformatRenderer.thumbnail.thumbnails[0].url;
resolve({ title, result: tinyUrl, result2: resultFix, thumb })}).catch(reject)})};

async function ytMp4(url) {
return new Promise(async(resolve, reject) => {
ytdl.getInfo(url).then(async(getUrl) => {
let result = [];
for(let i = 0; i < getUrl.formats.length; i++) {
let item = getUrl.formats[i];
if (item.container == 'mp4' && item.hasVideo == true && item.hasAudio == true) {
let { qualityLabel, contentLength } = item;
let bytes = await bytesToSize(contentLength);
result[i] = { video: item.url, quality: qualityLabel, size: bytes }}};
let resultFix = result.filter(x => x.video != undefined && x.size != undefined && x.quality != undefined) 
let tiny = await axios.get(`https://tinyurl.com/api-create.php?url=${resultFix[0].video}`);
let tinyUrl = tiny.data;
let title = getUrl.videoDetails.title;
let thumb = getUrl.player_response.microformat.playerMicroformatRenderer.thumbnail.thumbnails[0].url;
resolve({ title, result: tinyUrl, rersult2: resultFix[0].video, thumb })}).catch(reject)})};
*/
