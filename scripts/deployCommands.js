// scripts/deployCommands.js
// Registra los slash commands ante Discord sin arrancar el bot completo:
// carga los comandos híbridos, aplica el mismo recorte por prioridad que el
// boot normal (selectCommandsToRegister) y hace PUT contra la API.
//
// Uso:
//   node scripts/deployCommands.js              # registra (respetando DEV_GUILD_ID)
//   node scripts/deployCommands.js --dry-run    # solo imprime qué se registraría
//
// Requiere BOT_TOKEN y CLIENT_ID en .env.

require('dotenv').config();

const path = require('path');
const { Collection, REST } = require('discord.js');
const { loadHybridCommands } = require('../src/lib/commandLoader');
const { selectCommandsToRegister, putCommands } = require('../src/lib/registerCommands');
const config = require('../src/config');

const dryRun = process.argv.includes('--dry-run');

if (!config.BOT_TOKEN) {
    console.error('[deploy] Falta BOT_TOKEN en .env');
    process.exit(1);
}
if (!config.CLIENT_ID) {
    console.error('[deploy] Falta CLIENT_ID en .env');
    process.exit(1);
}

const client = { commands: new Collection(), prefixCommands: new Collection() };
loadHybridCommands(client, path.join(__dirname, '..', 'src', 'hybrid'));

const { toRegister, dropped } = selectCommandsToRegister(client);
const body = toRegister.map(c => c.data.toJSON());

const destino = config.DEV_GUILD_ID
    ? `el servidor de desarrollo ${config.DEV_GUILD_ID}`
    : 'globalmente (hasta 1h en propagar)';

console.log(`[deploy] ${body.length} comandos seleccionados de ${client.commands.size} candidatos (omitidos: ${dropped.length}).`);
console.log(`[deploy] Destino: ${destino}.`);

if (dryRun) {
    console.log('\n[dry-run] No se envió nada. Comandos que se registrarían:');
    for (const cmd of body) console.log(`  · ${cmd.name}`);
    process.exit(0);
}

(async () => {
    const rest = new REST({ version: '10' }).setToken(config.BOT_TOKEN);
    try {
        await putCommands(rest, body);
        console.log(`[deploy] ${body.length} comandos registrados.`);
    } catch (err) {
        console.error('[deploy] Error registrando comandos:', err);
        process.exitCode = 1;
    }
})();
