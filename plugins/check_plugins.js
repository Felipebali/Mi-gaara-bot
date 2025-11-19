import fs from "fs";
import path from "path";

const pluginsDir = "./plugins";

console.log("🔎 Verificando plugins en:", pluginsDir);

const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith(".js"));

for (const file of files) {
  const fullPath = path.join(pluginsDir, file);
  try {
    const plugin = await import(fullPath);
    const handler = plugin.default;

    if (!handler) {
      console.log(`❌ ${file}: No exporta handler`);
      continue;
    }

    let commands = handler.command;
    if (!commands) commands = handler.help || [];
    console.log(`✅ ${file}: comandos detectados ->`, Array.isArray(commands) ? commands.join(", ") : commands);
  } catch (e) {
    console.log(`⚠️ ${file}: Error al cargar plugin ->`, e.message);
  }
}
