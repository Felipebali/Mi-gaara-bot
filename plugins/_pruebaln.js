import fs from 'fs';
import path from 'path';

const dbFile = path.join(process.cwd(), 'blacklist.json');
const ownerNumbers = ["59898719147", "59896026646"];

// Inicializar archivo si no existe
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify({ blacklist: {} }, null, 2));

function readDB() { return JSON.parse(fs.readFileSync(dbFile, 'utf-8')); }
function writeDB(data) { fs.writeFileSync(dbFile, JSON.stringify(data, null, 2)); }

function getBlacklist() { 
  const data = readDB();
  return Object.entries(data.blacklist || {}).map(([jid, val]) => ({ jid, ...val }));
}
function isBlacklisted(jid) { return Boolean(readDB().blacklist[jid]); }
function addToBlacklist(jid, reason, phoneNumber) { 
  const data = readDB(); 
  data.blacklist[jid] = { reason, addedAt: Date.now(), phoneNumber }; 
  writeDB(data); 
}
function removeFromBlacklist(jid) { 
  const data = readDB(); 
  delete data.blacklist[jid]; 
  writeDB(data); 
}

// ----------------- PLUGIN HANDLER -----------------
export const handler = {
  command: ["ln", "unln", "ln2", "vln"],  // comandos
  owner: true,                             // solo dueños

  run: async ({ conn, m, command, remoteJid, text, isGroup }) => {
    try {
      // Aquí va toda la lógica que ya tenías de LN / UNLN / VLN
      if(command === "vln") {
        const entries = getBlacklist();
        if(entries.length === 0) return await conn.sendText(remoteJid, "📋 *No hay usuarios en lista negra.*", m);

        let msg = `🚫 *LISTA NEGRA* (${entries.length} usuario${entries.length > 1 ? 's' : ''})\n\n`;
        entries.forEach((entry, i) => {
          const num = entry.jid.split("@")[0];
          const fecha = new Date(entry.addedAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
          msg += `${i+1}. @${num}\n   📝 Razón: ${entry.reason}\n   📅 Desde: ${fecha}\n\n`;
        });
        const jids = entries.map(e => e.jid);
        return await conn.sendMessage(remoteJid, { text: msg, mentions: jids }, { quoted: m });
      }

      // Resto de LN / UNLN / LN2 aquí...
    } catch(err) {
      console.error('❌ Error handler lista negra:', err);
      await conn.sendText(remoteJid, '⚠️ *Error al procesar la lista negra.*', m);
    }
  }
};
