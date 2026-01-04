import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const SNAPSHOT = '.last_update_snapshot.json'
const REPO = 'https://github.com/Felipebali/Mi-gaara-bot.git'

function scanPlugins() {
  const dir = path.join(process.cwd(), 'plugins')
  if (!fs.existsSync(dir)) return []
  // Devuelve objeto con nombre y mtime (última modificación)
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.js'))
    .sort()
    .map(f => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
}

let handler = async (m, { conn }) => {
  let msg = '🔄 Verificando actualizaciones del bot...\n\n'
  let hasUpdates = false

  try {
    // ── GitHub ──
    try { execSync('git init', { stdio: 'ignore' }) } catch {}
    try { execSync(`git remote add origin ${REPO}`, { stdio: 'ignore' }) } catch {}
    execSync('git fetch origin main', { stdio: 'inherit' })
    const diff = execSync('git diff --name-status origin/main', { encoding: 'utf8' }).trim()
    if (diff) {
      hasUpdates = true
      execSync('git reset --hard origin/main', { stdio: 'inherit' })
      msg += '✅ *GitHub:* Bot actualizado correctamente.\n\n'
    } else {
      msg += '✅ *No hay actualizaciones de GitHub.*\n\n'
    }
  } catch (err) {
    msg += `❌ Error al actualizar desde GitHub:\n${err.message}\n\n`
  }

  // ── Plugins modificados ──
  let before = []
  if (fs.existsSync(SNAPSHOT)) {
    try { before = JSON.parse(fs.readFileSync(SNAPSHOT)) } catch {}
  }

  const now = scanPlugins()

  const added = now.filter(n => !before.find(b => b.name === n.name))
  const removed = before.filter(b => !now.find(n => n.name === b.name))
  const modified = now.filter(n => {
    const b = before.find(b => b.name === n.name)
    return b && b.mtime !== n.mtime
  })

  if (added.length || removed.length || modified.length) {
    hasUpdates = true
    msg += '🧩 *Cambios en plugins:*\n'
    added.forEach(p => msg += `• ➕ ${p.name}\n`)
    removed.forEach(p => msg += `• ❌ ${p.name} (eliminado)\n`)
    modified.forEach(p => msg += `• ✏️ ${p.name} (modificado)\n`)
  }

  fs.writeFileSync(SNAPSHOT, JSON.stringify(now, null, 2))
  await conn.reply(m.chat, msg, m)

  if (hasUpdates) setTimeout(() => {
    console.log('♻️ Bot reiniciándose tras actualización...')
    process.exit(0)
  }, 1500)
}

handler.command = ['update','up']
handler.rowner = true
export default handler
