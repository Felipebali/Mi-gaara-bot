import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const SNAPSHOT = '.last_update_snapshot.json'
const REPO = 'https://github.com/Felipebali/Mi-gaara-bot.git' // tu repo
const UPDATE_FLAG = '.update_done'

function scanPlugins() {
  const dir = path.join(process.cwd(), 'plugins')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort()
}

let handler = async (m, { conn }) => {
  let msg = '🔄 *Comprobando actualizaciones desde GitHub...*\n\n'
  let huboCambios = false

  try {
    // ── Respaldar archivos locales importantes ──
    const filesToBackup = ['config.js', '.env']
    const backups = {}
    filesToBackup.forEach(f => {
      if (fs.existsSync(f)) backups[f] = fs.readFileSync(f)
    })

    // ── Inicializar git si no existe ──
    try { execSync('git init', { stdio: 'ignore' }) } catch {}
    try { execSync(`git remote add origin ${REPO}`, { stdio: 'ignore' }) } catch {}

    // ── Pull forzado desde GitHub ──
    const result = execSync('git fetch origin main && git reset --hard origin/main', { encoding: 'utf8' })

    // Si git hizo algún cambio, marcamos huboCambios = true
    if (result.includes('HEAD is now at') || result.includes('Updating')) huboCambios = true

    // ── Restaurar archivos locales ──
    Object.keys(backups).forEach(f => fs.writeFileSync(f, backups[f]))

    msg += '✅ *GitHub:* Bot actualizado correctamente.\n\n'
  } catch (err) {
    msg += `❌ Error al actualizar desde GitHub:\n${err.message}\n\n`
  }

  // ── Detectar cambios en plugins ──
  let before = []
  if (fs.existsSync(SNAPSHOT)) {
    try { before = JSON.parse(fs.readFileSync(SNAPSHOT)) } catch {}
  }

  const now = scanPlugins()
  const added = now.filter(x => !before.includes(x))
  const removed = before.filter(x => !now.includes(x))

  if ((added && added.length) || (removed && removed.length)) {
    msg += '🧩 *Cambios en plugins:*\n'
    added.forEach(p => msg += `• ➕ ${p}\n`)
    removed.forEach(p => msg += `• ❌ ${p} (eliminado)\n`)
    huboCambios = true
  } else if (!huboCambios) {
    msg += '✅ *No hay nuevas actualizaciones ni cambios en plugins.*\n'
  }

  fs.writeFileSync(SNAPSHOT, JSON.stringify(now, null, 2))
  await conn.reply(m.chat, msg, m)

  // ── Solo reiniciar si hubo cambios ──
  if (huboCambios) {
    fs.writeFileSync(UPDATE_FLAG, JSON.stringify({ chat: m.chat, from: m.sender }))
    setTimeout(() => process.exit(0), 1500)
  }
}

handler.command = ['update','up']
handler.rowner = true
export default handler
