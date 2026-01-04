import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const SNAPSHOT = '.last_update_snapshot.json'
const REPO = 'https://github.com/Felipebali/Mi-gaara-bot.git' // tu repo

function scanPlugins() {
  const dir = path.join(process.cwd(), 'plugins')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort()
}

let handler = async (m, { conn }) => {
  let msg = '🔄 *Verificando actualizaciones del bot...*\n\n'
  let hasUpdates = false

  try {
    // ── Respaldar archivos y sesiones importantes ──
    const backupFiles = ['config.js', '.env']
    const backupDirs = ['GaaraSessions']
    const backups = {}

    // Respaldar archivos individuales
    backupFiles.forEach(f => {
      if (fs.existsSync(f)) backups[f] = fs.readFileSync(f)
    })

    // Respaldar carpetas (como GaaraSessions)
    backupDirs.forEach(d => {
      if (fs.existsSync(d)) {
        backups[d] = fs.readdirSync(d).reduce((acc, file) => {
          acc[file] = fs.readFileSync(path.join(d, file))
          return acc
        }, {})
      }
    })

    // ── Inicializar git si no existe ──
    try { execSync('git init', { stdio: 'ignore' }) } catch {}
    try { execSync(`git remote add origin ${REPO}`, { stdio: 'ignore' }) } catch {}

    // ── Hacer pull seguro ──
    execSync('git fetch origin main', { stdio: 'inherit' })
    execSync('git reset --hard origin/main', { stdio: 'inherit' })
    hasUpdates = true

    // ── Restaurar archivos y sesiones ──
    Object.keys(backups).forEach(f => {
      if (fs.lstatSync(f).isDirectory && backupDirs.includes(f)) {
        Object.keys(backups[f]).forEach(file => {
          fs.writeFileSync(path.join(f, file), backups[f][file])
        })
      } else {
        fs.writeFileSync(f, backups[f])
      }
    })

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
    hasUpdates = true
    msg += '🧩 *Cambios en plugins:*\n'
    added?.forEach(p => msg += `• ➕ ${p}\n`)
    removed?.forEach(p => msg += `• ❌ ${p} (eliminado)\n`)
  } else if (!hasUpdates) {
    msg += '✅ *No hay nuevas actualizaciones ni plugins.*\n'
  }

  fs.writeFileSync(SNAPSHOT, JSON.stringify(now, null, 2))

  await conn.reply(m.chat, msg, m)

  // ── Solo reiniciar si hubo actualizaciones ──
  if (hasUpdates) {
    setTimeout(() => {
      console.log('♻️ Bot reiniciándose tras actualización...')
      process.exit(0)
    }, 1500)
  }
}

handler.command = ['update','up']
handler.rowner = true
export default handler
