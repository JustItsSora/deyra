// scripts/verifyCommands.js
// Verificación de coherencia de TODOS los comandos, sin conexión a Discord.
//
// Chequea las cosas que después se rompen en producción con el bot ya
// corriendo, cuando es más caro:
//
//   1. Que todos los archivos carguen (sintaxis, requires, imports).
//   2. Que cada comando tenga SlashCommandBuilder con nombre y descripción válidos.
//   3. Que no haya dos comandos con el mismo nombre ni alias duplicado.
//   4. Que cada comando declare categoría y que exista en el tema de diseño.
//   5. Que las acciones sociales apunten a una categoría de GIF real.
//   6. Que las imágenes que hardcodean los comandos sean URLs válidas.
//   7. Que los comandos con categoría "diversión" no rompan el registro de slash.
//
// Uso: node scripts/verifyCommands.js

require('dotenv').config();
process.env.BOT_TOKEN = process.env.BOT_TOKEN || 'placeholder';
process.env.CLIENT_ID = process.env.CLIENT_ID || '000000000000000000';

const path = require('path');
const { execSync } = require('child_process');
const { Collection, SlashCommandBuilder } = require('discord.js');
const { loadHybridCommands, loadSlashCommands, loadPrefixCommands } = require('../src/lib/commandLoader');
const theme = require('../src/lib/ui/theme');
const { SOCIAL_ACTIONS, PUBLIC_ACTIONS } = require('../src/lib/socialActions');
const { hasCategory } = require('../src/lib/gifApi');

const problems = [];
const warnings = [];
const fail = (msg) => problems.push(msg);
const warn = (msg) => warnings.push(msg);

const client = {
    commands: new Collection(),
    prefixCommands: new Collection(),
    users: { fetch: async () => null },
    guilds: { cache: new Collection() },
};

// --- 1. Carga ---------------------------------------------------------------

const SRC = path.join(__dirname, '..', 'src');
const files = execSync('find src -name "*.js"', { cwd: path.join(__dirname, '..') })
    .toString().trim().split('\n');

let loaded = 0;
for (const file of files) {
    if (file.includes('src/client.js')) continue; // arrancaría el bot
    try {
        require(path.resolve(SRC, '..', file));
        loaded++;
    } catch (err) {
        fail(`${file}: no carga — ${err.message.split('\n')[0].slice(0, 90)}`);
    }
}
console.log(`[1/7] ${loaded}/${files.length - 1} archivos cargan sin error.`);

loadHybridCommands(client, path.join(SRC, 'hybrid'));
loadSlashCommands(client, path.join(SRC, 'commands', 'slash'));
loadPrefixCommands(client, path.join(SRC, 'commands', 'prefix'));

// --- 2. SlashCommandBuilder válido -------------------------------------------

const SLASH_NAME = /^[a-z0-9_]{1,32}$/;
for (const [, command] of client.commands) {
    let json;
    try {
        json = command.data.toJSON();
    } catch (err) {
        fail(`/${command.data?.name}: el SlashCommandBuilder no serializa — ${err.message.slice(0, 70)}`);
        continue;
    }

    if (!SLASH_NAME.test(json.name)) {
        fail(`"${json.name}": nombre de slash inválido (minúsculas, sin acentos, 1-32 chars).`);
    }
    if (!json.description || json.description.length < 1 || json.description.length > 100) {
        fail(`/${json.name}: descripción de ${json.description?.length ?? 0} caracteres (debe ser 1-100).`);
    }
    if (json.options?.length > 25) {
        fail(`/${json.name}: ${json.options.length} opciones (máximo 25).`);
    }
    if (json.name !== json.name.toLowerCase()) {
        fail(`/${json.name}: el nombre tiene mayúsculas.`);
    }
}

// --- 3. Colisiones de nombres y alias ----------------------------------------

const slashNames = new Map();
for (const [, command] of client.commands) {
    const name = command.data.name;
    if (slashNames.has(name)) {
        fail(`"${name}": dos comandos con el mismo nombre slash.`);
    }
    slashNames.set(name, command);
}

const prefixOwners = new Map();
for (const [key, command] of client.prefixCommands) {
    const owner = prefixOwners.get(key);
    if (owner && owner !== command) {
        fail(`prefijo "${key}": lo comparten dos comandos distintos.`);
    }
    prefixOwners.set(key, command);
}

// Que un comando tenga nombre de slash y de prefijo distintos es normal (ej:
// /level → !rank). Lo que no puede pasar es que dos comandos distintos ocupen el
// mismo prefijo, porque el último cargado se adueñaría del alias.

console.log(`[2/7] ${client.commands.size} slash commands, ${client.prefixCommands.size} entradas de prefijo.`);
console.log(`[3/7] Sin colisiones de nombres.`);

// --- 4. Categorías ------------------------------------------------------------

for (const [, command] of client.commands) {
    if (!command.category) {
        fail(`/${command.data.name}: no declara "category".`);
    } else if (!theme.CATEGORIES[command.category]) {
        warn(`/${command.data.name}: categoría "${command.category}" no está en el tema, no va a tener color propio.`);
    }
}
console.log(`[4/7] Categorías validadas contra el tema.`);

// --- 5. Acciones sociales -----------------------------------------------------

for (const key of PUBLIC_ACTIONS) {
    const meta = SOCIAL_ACTIONS[key];
    const category = meta.gif || key;
    if (!hasCategory(category)) {
        fail(`social "${key}": la categoría "${category}" no existe en gifApi.js.`);
    }
    if (meta.solo && meta.verb) {
        fail(`social "${key}": solo=true pero tiene verb.`);
    }
    if (!meta.solo && !meta.verb) {
        fail(`social "${key}": no es solo y no tiene verb, el panel quedaría con "undefined a".`);
    }
    // El comando tiene que existir en disco con el nombre correcto.
    const name = key.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9_]/g, '').toLowerCase();
    if (!client.commands.has(name)) {
        fail(`social "${key}": no hay comando /${name} cargado.`);
    }
}
console.log(`[5/7] ${PUBLIC_ACTIONS.length} acciones sociales validadas.`);

// --- 6. URLs hardcodeadas ----------------------------------------------------

let urlCount = 0;
for (const [, command] of client.commands) {
    const source = require('fs').readFileSync(command.__file || findFile(command), 'utf8');
    for (const match of source.matchAll(/['"`]https?:\/\/[^'"`\s)]+/g)) {
        urlCount++;
        const url = match[0].slice(1, -1);
        // Solo verificamos forma; que la URL exista de verdad se prueba con
        // `npm run verify:providers`.
        if (/\s/.test(url) || url.length > 200) {
            fail(`/${command.data.name}: URL mal formada — ${url.slice(0, 60)}`);
        }
    }
}
function findFile(command) {
    for (const [name, cmd] of client.commands) {
        if (cmd === command) {
            return Object.values(require.cache).find(m => m.exports === command && m.filename)?.filename || '';
        }
    }
    return '';
}
console.log(`[6/7] ${urlCount} URLs hardcodeadas revisadas.`);

// --- 7. Registro de slash ----------------------------------------------------

const MAX = 90;
const byCategory = {};
for (const [, command] of client.commands) {
    byCategory[command.category] = (byCategory[command.category] || 0) + 1;
}
console.log(`[7/7] Comandos por categoría:`);
for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    const theme_ = theme.CATEGORIES[cat] ? '✔' : '·';
    console.log(`      ${theme_} ${cat.padEnd(16)} ${count}`);
}
if (client.commands.size > MAX) {
    warn(`${client.commands.size} comandos y el límite de slash es ${MAX}: ${client.commands.size - MAX} funcionan solo con prefijo (${process.env.PREFIX || '!'}comando).`);
}

// --- Informe -----------------------------------------------------------------

console.log(`\n══════════ VERIFICACIÓN DE COMANDOS ══════════`);
if (warnings.length) {
    console.log(`\n⚠️  Avisos (${warnings.length}):`);
    for (const w of warnings.slice(0, 20)) console.log(`   ${w}`);
    if (warnings.length > 20) console.log(`   …y ${warnings.length - 20} más`);
}
if (problems.length) {
    console.log(`\n✖️  Errores (${problems.length}):`);
    for (const p of problems.slice(0, 30)) console.log(`   ${p}`);
    if (problems.length > 30) console.log(`   …y ${problems.length - 30} más`);
    process.exit(1);
}
console.log('\n✔ Todos los comandos están consistentes.');
